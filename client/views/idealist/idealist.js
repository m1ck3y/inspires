define('ideaListView', function() {
    // Setup listeners
    jQuery(document).on('click', '[data-behavior~=add-idea]', function() {
        
    });

    var ideaListView = (function() {
        return {
            get_root_ideas: function() {
                return Ideas.find({}, {fields: {name: 1}});
            },

            // Basically displays all root ideas
            display_root_ideas: function() {
                // Ideas.insert({"_id": new Meteor.Collection.ObjectID().toHexString(), name: 'level one', children: [{"_id": new Meteor.Collection.ObjectID().toHexString(), name: 'level two', children: [{name: 'level three', children: {}}]}]});
            }
        }
    }());

    // Template.ideaList.rendered = 

    Template.ideaList.helpers({
        root_ideas: ideaListView.get_root_ideas.bind(ideaListView)
    });
});