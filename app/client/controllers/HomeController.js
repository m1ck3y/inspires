'use strict';

window.HomeController = RouteController.extend({
    show: function() {
        this.render(Meteor.user() ? 'ideaList' : 'landing');
    }
});