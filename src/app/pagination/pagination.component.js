'use strict';

!function()
{
    angular.module('app').component('pagination', {
        templateUrl: '/app/pagination/pagination.component.html',
        controller : PaginationController,
        bindings   : {
            pages    : '<',
            onSetPage: '&'
        }
    });

    PaginationController.$inject = ['$scope'];

    function PaginationController($scope)
    {
        let $ctrl = $scope.$ctrl;

        this.$onInit = () =>
        {
            $scope.paging = $scope.$ctrl.pages;
        };

        $scope.setPage = setPage;

        /**
         * Sets number of the page, evaluates parent onSetPage function with start and end parameters
         *
         * @param {Number} page Page number
         */
        function setPage(page)
        {
            if (page < 1 || page > $scope.paging.total) {
                return;
            }

            $scope.paging.range_start = (page - 1) * $scope.paging.per_page;
            $scope.paging.range_end = page * $scope.paging.per_page;
            $scope.paging.page = page;

            $ctrl.onSetPage({
                start: $scope.paging.range_start,
                end  : $scope.paging.range_end
            });
        }
    }
}();