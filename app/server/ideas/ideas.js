'use strict';

Meteor.publish('ideas', function(path) {
    var matches = path.match(/^\/([a-zA-Z0-9]{12,})\/([a-zA-Z0-9]{24})\/?$/);

    if (matches !== null) {
        return Ideas.find({
            _id: matches[2]
            ,owner: matches[1]
        });
    } else {
        return Ideas.find({
            $or: [
                {private: {$exists: false}}
                ,{private: false}
                ,{private: true, owner: this.userId}
            ]
        });
    }
});

Meteor.methods({
    ideaDelete: function (objectId, path) {
        objectId = new Meteor.Collection.ObjectID(objectId).toHexString();

        // Declare variables
        var select = {}
            ,update = {}
            ,user = Meteor.user()
            ;

        // Build select
        select[path.select_path + '_id'] = objectId;

        if (!user.permissions || user.permissions.indexOf('admin') === -1) {
            select[path.select_path + 'owner'] = this.userId;
            select[path.select_path + 'children'] = {$size: 0};
        }

        // Let's make sure the item exists
        if (Ideas.find(select).fetch().length === 0) {
            return false;
        }

        // Build update
        update[path.remove_path] = {_id: objectId};

        // Check if object is root
        if (objectId === path.root_id) {
            Ideas.remove(select);
        } else {
            Ideas.update(select, {$pull: update, $set: {updatedOn: new Date()}});
        }

        // Update users
        select = {};
        select['ideas.voted.' + objectId] = {$exists: true};
        update = {};
        update['ideas.voted.' + objectId] = 'up';
        update['ideas.voted.' + objectId] = 'down';
        Meteor.users.update({$or: [
                {'ideas.opened': objectId}
                ,select
            ]}
            ,{
                $pull: {'ideas.opened': objectId}
                ,$unset: update
            }
            ,{multi: true});
    },

    ideaVote: function (vote_type, objectId, path) {
        objectId = new Meteor.Collection.ObjectID(objectId).toHexString();

        if (['up', 'down'].indexOf(vote_type) === -1) {
            return false;
        }

        // Declare variables
        var user = Meteor.user()
            ,select = {}
            ,update = {}
            ;

        // Build select
        select[path.select_path + '_id'] = objectId;

        if (user.ideas.voted[objectId]) {
            // User has already voted for this vote type then we remove the vote
            if (user.ideas.voted[objectId] === vote_type) {
                // Decrement vote from vote type
                update[path.select_path + 'votes.' + vote_type] = -1;
                Ideas.update(select, {$inc: update});

                // Update the user
                update = {};
                update['ideas.voted.' + objectId] = vote_type;
                Meteor.users.update({_id: this.userId}, {$unset: update});

                return;
            } else {
                // If user is changing their vote then we need to subtract one of the other type
                update[path.select_path + 'votes.' + (vote_type === 'up' ? 'down': 'up')] = -1;
            }
        }

        // Build update
        update[path.select_path + 'votes.' + vote_type] = 1;

        // Increment vote
        Ideas.update(select, {$inc: update});

        // Record the ideas this user has voted on
        update = {};
        update['ideas.voted.' + objectId] = vote_type;
        Meteor.users.update({_id: this.userId}, {$set: update});
    }
});
