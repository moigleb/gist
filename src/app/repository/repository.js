'use strict';

!function()
{
    angular.module('app.repository', []).controller('RepositoryController', RepositoryController);

    RepositoryController.$inject = ['$scope', '$routeParams', 'DataService'];

    function RepositoryController($scope, $routeParams, DataService)
    {
        let allUsers = null;

        /**
         * Pagination config
         */
        $scope.paging = {
            page       : 1,
            per_page   : 30,
            range_start: 0,
            range_end  : 30
        };

        $scope.userName = $routeParams.user;
        $scope.repoName = $routeParams.repo;
        $scope.currentUsers = null;
        $scope.repository = null;

        /**
         * Loads repository data and his contributors
         */
        DataService.getRepo($routeParams.user, $routeParams.repo).then(repo =>
        {
            $scope.repository = repo;
            DataService.getAllContributors(repo).then(data =>
            {
                allUsers = data;
                $scope.currentUsers = data.slice($scope.paging.range_start, $scope.paging.range_end);
                $scope.paging.total = Math.ceil(data.length / $scope.paging.per_page);
            });
        }, () => $scope.errorPage = 'Data can\'t be loaded!');

        $scope.setPage = setPage;

        /**
         * Sets current page of the data list
         *
         * @param {Number} start Start index for data slicing
         * @param {Number} end   End index for data slicing
         */
        function setPage(start, end)
        {
            $scope.currentUsers = allUsers.slice(start, end);
        }
    }
}();
