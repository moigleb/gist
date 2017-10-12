'use strict';

!function()
{
    angular.module('app.main', []).controller('MainController', MainController);

    MainController.$inject = ['$scope', '$filter', 'DataService'];

    function MainController($scope, $filter, DataService)
    {
        let allUsers = null;

        /**
         * Pagination config
         */
        $scope.paging = {
            page: 1,
            per_page: 30,
            range_start: 0,
            range_end: 30
        };

        $scope.organization = 'angular';
        $scope.currentUsers = null;
        $scope.sortConfig = {
            type  : null,
            revert: false
        };

        /**
         * Get contributors data for all organisation repositories
         */
        DataService.getAllUniqueContributors($scope.organization).then(response =>
        {
            allUsers = response.data;
            $scope.sortByType('login');
            $scope.paging.total = Math.ceil(response.data.length / $scope.paging.per_page);
        }, () => $scope.errorPage = 'Data can\'t be loaded!');

        $scope.setPage = setPage;
        $scope.sortByType = sortByType;

        /**
         * Sets current page of the data list
         *
         * @param {Number} [start] Start index for data slicing
         * @param {Number} [end]   End index for data slicing
         */
        function setPage(start, end)
        {
            $scope.currentUsers = allUsers.slice(start, end);
        }

        /**
         * Sorts information by the type
         *
         * @param {String} type Desired type for sorting
         */
        function sortByType(type)
        {
            if ($scope.sortConfig.type === type) {
                $scope.sortConfig.revert = !$scope.sortConfig.revert;
            } else {
                $scope.sortConfig.type = type;
                $scope.sortConfig.revert = false;
            }

            allUsers = $filter('orderBy')(allUsers, type, $scope.sortConfig.revert);
            $scope.setPage($scope.paging.range_start, $scope.paging.range_end);
        }
    }
}();
