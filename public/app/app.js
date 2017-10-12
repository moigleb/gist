'use strict';

angular.module('app', ['app.routes', 'app.main', 'app.contributor', 'app.repository']);
'use strict';

!function () {
    angular.module('app.routes', ['ngRoute']).config(routes);

    routes.$inject = ['$routeProvider'];

    function routes($routeProvider) {
        $routeProvider.when('/', {
            templateUrl: '/app/main/main.html',
            controller: 'MainController'
        }).when('/contributor/:login', {
            templateUrl: '/app/contributor/contributor.html',
            controller: 'ContributorController'
        }).when('/:user/:repo', {
            templateUrl: 'app/repository/repository.html',
            controller: 'RepositoryController'
        }).otherwise({
            redirectTo: '/'
        });
    }
}();
'use strict';

!function () {
    angular.module('app.main', []).controller('MainController', MainController);

    MainController.$inject = ['$scope', '$filter', 'DataService'];

    function MainController($scope, $filter, DataService) {
        var allUsers = null;

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
            type: null,
            revert: false
        };

        /**
         * Get contributors data for all organisation repositories
         */
        DataService.getAllUniqueContributors($scope.organization).then(function (response) {
            allUsers = response.data;
            $scope.sortByType('login');
            $scope.paging.total = Math.ceil(response.data.length / $scope.paging.per_page);
        }, function () {
            return $scope.errorPage = 'Data can\'t be loaded!';
        });

        $scope.setPage = setPage;
        $scope.sortByType = sortByType;

        /**
         * Sets current page of the data list
         *
         * @param {Number} [start] Start index for data slicing
         * @param {Number} [end]   End index for data slicing
         */
        function setPage(start, end) {
            $scope.currentUsers = allUsers.slice(start, end);
        }

        /**
         * Sorts information by the type
         *
         * @param {String} type Desired type for sorting
         */
        function sortByType(type) {
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
'use strict';

!function () {
    angular.module('app').component('pagination', {
        templateUrl: '/app/pagination/pagination.component.html',
        controller: PaginationController,
        bindings: {
            pages: '<',
            onSetPage: '&'
        }
    });

    PaginationController.$inject = ['$scope'];

    function PaginationController($scope) {
        var $ctrl = $scope.$ctrl;

        this.$onInit = function () {
            $scope.paging = $scope.$ctrl.pages;
        };

        $scope.setPage = setPage;

        /**
         * Sets number of the page, evaluates parent onSetPage function with start and end parameters
         *
         * @param {Number} page Page number
         */
        function setPage(page) {
            if (page < 1 || page > $scope.paging.total) {
                return;
            }

            $scope.paging.range_start = (page - 1) * $scope.paging.per_page;
            $scope.paging.range_end = page * $scope.paging.per_page;
            $scope.paging.page = page;

            $ctrl.onSetPage({
                start: $scope.paging.range_start,
                end: $scope.paging.range_end
            });
        }
    }
}();
'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

!function () {
    angular.module('app').factory('DataService', DataService);

    DataService.$inject = ['$http', '$q'];

    function DataService($http, $q) {
        var factory = {};
        var URL = {
            main: 'https://api.github.com',
            organization: 'orgs',
            repositories: 'repos',
            user: 'users'
        };

        factory.allData = [];

        factory.getAllUniqueContributors = getAllUniqueContributors;
        factory.getUserData = getUserData;
        factory.getRepos = getRepos;
        factory.getRepo = getRepo;
        factory.getAllContributors = getAllContributors;
        factory.getContributors = getContributors;

        /**
         * Checks existing contributors data in localStorage and loads it if needed
         *
         * @param {String} orgName Organization name
         * @returns {Promise} Promise with contributors data
         */
        function getAllUniqueContributors(orgName) {
            var loadData = true;

            if (localStorage.getItem(orgName + '_users')) {
                try {
                    var time = JSON.parse(localStorage.getItem('timeEnd')).time;

                    if (time > Date.now()) {
                        loadData = false;
                        var data = JSON.parse(localStorage.getItem(orgName + '_users'));

                        return $q(function (resolve) {
                            return resolve(data);
                        });
                    }
                } catch (error) {
                    return $q.reject();
                }
            }

            if (loadData) {
                return $q(function (resolve, reject) {
                    return getAllInfo(orgName).then(function (response) {
                        if (!response || !response.length) {
                            return reject();
                        }

                        var cached_data = {
                            data: response
                        };

                        localStorage.setItem(orgName + '_users', JSON.stringify(cached_data));
                        localStorage.setItem('timeEnd', JSON.stringify({ time: Date.now() + 10 * 60 * 1000 }));

                        resolve(cached_data);
                    }, reject);
                });
            }
        }

        /**
         * Loads information of all unique contributors in all organisation repositories
         *
         * @param {String} orgName Organization name
         * @returns {Promise} Promise with contributors data
         */
        function getAllInfo(orgName) {
            return $q(function (resolve, reject) {
                return getOrgsInfo(orgName).then(function (organization) {
                    getAllRepos(organization).then(function (repositories) {
                        var queries = [];
                        var repos = [];
                        var contributors = [];

                        /**
                         * Expand information about organisation repositories in one array
                         */
                        repositories.forEach(function (repo) {
                            return repos.push.apply(repos, _toConsumableArray(repo));
                        });

                        /**
                         * Prepare queries for getting contributors data
                         */
                        repos.map(function (repo) {
                            queries.push(getAllContributors(repo).then(function (data) {
                                var _contributors;

                                return (_contributors = contributors).push.apply(_contributors, _toConsumableArray(data));
                            }));
                        });

                        /**
                         * Load unique contributors
                         */
                        $q.all(queries).then(function () {
                            var tmpElements = [];

                            contributors = contributors.filter(function (item) {
                                if (tmpElements[item.id]) {
                                    tmpElements[item.id].contributions += item.contributions;
                                    return false;
                                }

                                tmpElements[item.id] = item;
                                return true;
                            });

                            /**
                             * Collect information about repositories, gists, and followers for each contributor
                             */
                            queries = [];
                            contributors.forEach(function (item, index) {
                                // TODO: Delete 'if'
                                if (index < 70) {
                                    queries.push($http.get(item.url).then(function (response) {
                                        item.public_repos = response.data.public_repos;
                                        item.public_gists = response.data.public_gists;
                                        item.followers = response.data.followers;
                                    }));
                                }
                            });

                            $q.all(queries).then(function () {
                                return resolve(contributors);
                            }, reject);
                        }, reject);
                    }, reject);
                }, function (error) {
                    return reject(error);
                });
            });
        }

        /**
         * Loads organisation information
         *
         * @param {String} orgName Organization name
         * @returns {Promise} Promise with organization data
         */
        function getOrgsInfo(orgName) {
            return $http.get(URL.main + '/' + URL.organization + '/' + orgName).then(function (response) {
                return response.data;
            }, function (error) {
                return error;
            });
        }

        /**
         * Loads all client repositories
         *
         * @param {Object} clientData client information with API links
         * @returns {Promise} Promise with data of all client repositories
         */
        function getAllRepos(clientData) {
            var pages = Math.ceil(clientData.public_repos / 100);
            var queries = [];

            while (pages) {
                queries.push(getRepos(clientData.repos_url, 100, pages--));
            }

            return $q.all(queries);
        }

        /**
         * Loads data about client repositories
         *
         * @param {String}  url           API link for client repositories
         * @param {Number}  perPage       Repositories amount for one page
         * @param {Number}  page          Current page
         * @param {Boolean} [cache=false] Query will be cached if passed true
         * @returns {Promise} Promise with one page of client repository
         */
        function getRepos(url, perPage, page, cache) {
            var config = {
                params: {
                    per_page: perPage,
                    page: page
                },
                cache: cache
            };

            return $http.get(url, config).then(function (response) {
                return response.data;
            }, function (error) {
                return error;
            });
        }

        /**
         * Loads data for single client repository
         *
         * @param {String} userName User login
         * @param {String} repoName Repository name
         * @returns {Promise} Promise with repository data
         */
        function getRepo(userName, repoName) {
            return $http.get(URL.main + '/' + URL.repositories + '/' + userName + '/' + repoName).then(function (response) {
                return response.data;
            }, function (error) {
                return error;
            });
        }

        /**
         * Loads data of all repository contributors
         *
         * @param {Object} repo Repository data
         * @returns {Promise} Promise with all contributors data
         */
        function getAllContributors(repo) {
            var contributors = [];
            var url = repo['contributors_url'];

            return $q(function (resolve, reject) {
                function getPage(page) {
                    getContributors(url, page).then(function (response) {
                        contributors.push.apply(contributors, _toConsumableArray(response));
                        response.length >= 100 ? getPage(page + 1) : resolve(contributors);
                    }, reject);
                }

                getPage(1);
            });
        }

        /**
         * Loads data of repository contributors
         *
         * @param {String} url  API link for repository contributors
         * @param {Number} page Page number
         * @returns {Promise} Promise with contributors data
         */
        function getContributors(url, page) {
            var config = {
                params: {
                    per_page: 100,
                    page: page,
                    anon: false
                }
            };

            return $http.get(url, config).then(function (response) {
                return response.data;
            }, function (error) {
                return error;
            });
        }

        /**
         * Loads user data and his repositories
         *
         * @param {String} login User login
         * @returns {Promise} Promise with user data and first page of his repositories
         */
        function getUserData(login) {
            return $http.get(URL.main + '/' + URL.user + '/' + login).then(function (response) {
                return getRepos(response.data.repos_url, 30, 1, true).then(function (data) {
                    return { user_data: response.data, repos_data: data };
                }, function (error) {
                    return error;
                });
            }, function (error) {
                return error;
            });
        }

        return factory;
    }
}();
'use strict';

angular.module('app').factory('InterceptorConfig', function () {
    var interceptor = {};

    interceptor.request = function (config) {
        !config.params && (config.params = {});

        config.params.client_id = '8772f6c1cd842984c1af';
        config.params.client_secret = '40b9b29d130d493bc017e8e505b94b2ca1ea70aa';

        return config;
    };

    return interceptor;
});

angular.module('app').config(['$httpProvider', function ($httpProvider) {
    return $httpProvider.interceptors.push('InterceptorConfig');
}]);
'use strict';

!function () {
    angular.module('app.repository', []).controller('RepositoryController', RepositoryController);

    RepositoryController.$inject = ['$scope', '$routeParams', 'DataService'];

    function RepositoryController($scope, $routeParams, DataService) {
        var allUsers = null;

        /**
         * Pagination config
         */
        $scope.paging = {
            page: 1,
            per_page: 30,
            range_start: 0,
            range_end: 30
        };

        $scope.userName = $routeParams.user;
        $scope.repoName = $routeParams.repo;
        $scope.currentUsers = null;
        $scope.repository = null;

        /**
         * Loads repository data and his contributors
         */
        DataService.getRepo($routeParams.user, $routeParams.repo).then(function (repo) {
            $scope.repository = repo;
            DataService.getAllContributors(repo).then(function (data) {
                allUsers = data;
                $scope.currentUsers = data.slice($scope.paging.range_start, $scope.paging.range_end);
                $scope.paging.total = Math.ceil(data.length / $scope.paging.per_page);
            });
        }, function () {
            return $scope.errorPage = 'Data can\'t be loaded!';
        });

        $scope.setPage = setPage;

        /**
         * Sets current page of the data list
         *
         * @param {Number} start Start index for data slicing
         * @param {Number} end   End index for data slicing
         */
        function setPage(start, end) {
            $scope.currentUsers = allUsers.slice(start, end);
        }
    }
}();
'use strict';

!function () {
    angular.module('app.contributor', []).controller('ContributorController', ContributorController);

    ContributorController.$inject = ['$scope', '$routeParams', 'DataService'];

    function ContributorController($scope, $routeParams, DataService) {
        /**
         * Pagination config
         */
        $scope.paging = {
            page: 1,
            per_page: 30,
            range_start: 0,
            range_end: 30
        };

        /**
         * Load user data and his repositories
         */
        DataService.getUserData($routeParams['login']).then(function (data) {
            $scope.user = data.user_data;
            $scope.currentRepos = data.repos_data;
            $scope.paging.total = Math.ceil(data.user_data.public_repos / $scope.paging.per_page);
        }, function () {
            return $scope.errorPage = 'Data can\'t be loaded!';
        });

        $scope.setPage = setPage;

        /**
         * Sets current page of the data list
         */
        function setPage() {
            DataService.getRepos($scope.user.repos_url, $scope.paging.per_page, $scope.paging.page).then(function (response) {
                return $scope.currentRepos = response;
            });
        }
    }
}();