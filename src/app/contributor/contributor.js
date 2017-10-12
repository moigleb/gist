'use strict';

!function()
{
    angular.module('app.contributor', [])
        .controller('ContributorController', ContributorController);

    ContributorController.$inject = ['$scope', '$routeParams', 'DataService'];

    function ContributorController($scope, $routeParams, DataService)
    {
        /**
         * Pagination config
         */
        $scope.paging = {
            page       : 1,
            per_page   : 30,
            range_start: 0,
            range_end  : 30
        };

        /**
         * Load user data and his repositories
         */
        DataService.getUserData($routeParams['login']).then(data =>
        {
            $scope.user = data.user_data;
            $scope.currentRepos = data.repos_data;
            $scope.paging.total = Math.ceil(data.user_data.public_repos / $scope.paging.per_page);
        }, () => $scope.errorPage = 'Data can\'t be loaded!');

        $scope.setPage = setPage;

        /**
         * Sets current page of the data list
         */
        function setPage()
        {
            DataService.getRepos($scope.user.repos_url, $scope.paging.per_page, $scope.paging.page)
                .then(response => $scope.currentRepos = response);
        }
    }
}();
