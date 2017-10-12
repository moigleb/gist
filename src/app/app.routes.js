'use strict';

!function()
{
    angular.module('app.routes', ['ngRoute']).config(routes);

    routes.$inject = ['$routeProvider'];

    function routes($routeProvider)
    {
        $routeProvider
            .when('/', {
                templateUrl: '/app/main/main.html',
                controller: 'MainController'
            })
            .when('/contributor/:login', {
                templateUrl: '/app/contributor/contributor.html',
                controller: 'ContributorController'
            })
            .when('/:user/:repo', {
                templateUrl: 'app/repository/repository.html',
                controller: 'RepositoryController'
            })
            .otherwise({
                redirectTo: '/'
            });
    }
}();
