'use strict';

!function()
{
    angular.module('app').factory('DataService', DataService);

    DataService.$inject = ['$http', '$q'];

    function DataService($http, $q)
    {
        let factory = {};
        const URL = {
            main        : 'https://api.github.com',
            organization: 'orgs',
            repositories: 'repos',
            user        : 'users'
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
        function getAllUniqueContributors(orgName)
        {
            let loadData = true;

            if (localStorage.getItem(`${orgName}_users`)) {
                try {
                    let time = JSON.parse(localStorage.getItem('timeEnd')).time;

                    if (time > Date.now()) {
                        loadData = false;
                        let data = JSON.parse(localStorage.getItem(`${orgName}_users`));

                        return $q(resolve => resolve(data));
                    }
                } catch (error) {
                    return $q.reject();
                }
            }

            if (loadData) {
                return $q((resolve, reject) => getAllInfo(orgName).then(response =>
                {
                    if (!response || !response.length) {
                        return reject();
                    }

                    let cached_data = {
                        data: response
                    };

                    localStorage.setItem(`${orgName}_users`, JSON.stringify(cached_data));
                    localStorage.setItem('timeEnd', JSON.stringify({time: Date.now() + (10 * 60 * 1000)}));

                    resolve(cached_data);
                }, reject));
            }
        }

        /**
         * Loads information of all unique contributors in all organisation repositories
         *
         * @param {String} orgName Organization name
         * @returns {Promise} Promise with contributors data
         */
        function getAllInfo(orgName)
        {
            return $q((resolve, reject) => getOrgsInfo(orgName).then(organization =>
            {
                getAllRepos(organization).then(repositories =>
                {
                    let queries = [];
                    let repos = [];
                    let contributors = [];

                    /**
                     * Expand information about organisation repositories in one array
                     */
                    repositories.forEach(repo => repos.push(...repo));

                    /**
                     * Prepare queries for getting contributors data
                     */
                    repos.map(repo =>
                    {
                        queries.push(getAllContributors(repo).then(data => contributors.push(...data)));
                    });

                    /**
                     * Load unique contributors
                     */
                    $q.all(queries).then(() =>
                    {
                        let tmpElements = [];

                        contributors = contributors.filter(item =>
                        {
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
                        contributors.forEach((item, index) =>
                        {
                            // TODO: Delete 'if'
                            if (index < 70) {
                                queries.push($http.get(item.url).then(response =>
                                {
                                    item.public_repos = response.data.public_repos;
                                    item.public_gists = response.data.public_gists;
                                    item.followers = response.data.followers;
                                }));
                            }
                        });

                        $q.all(queries).then(() => resolve(contributors), reject);
                    }, reject);
                }, reject);
            }, error => reject(error)));
        }

        /**
         * Loads organisation information
         *
         * @param {String} orgName Organization name
         * @returns {Promise} Promise with organization data
         */
        function getOrgsInfo(orgName)
        {
            return $http.get(`${URL.main}/${URL.organization}/${orgName}`).then(
                response => response.data,
                error => error
            );
        }

        /**
         * Loads all client repositories
         *
         * @param {Object} clientData client information with API links
         * @returns {Promise} Promise with data of all client repositories
         */
        function getAllRepos(clientData)
        {
            let pages = Math.ceil(clientData.public_repos / 100);
            let queries = [];

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
        function getRepos(url, perPage, page, cache)
        {
            let config = {
                params: {
                    per_page: perPage,
                    page
                },
                cache : cache
            };

            return $http.get(url, config).then(
                response => response.data,
                error => error
            );
        }

        /**
         * Loads data for single client repository
         *
         * @param {String} userName User login
         * @param {String} repoName Repository name
         * @returns {Promise} Promise with repository data
         */
        function getRepo(userName, repoName)
        {
            return $http.get(`${URL.main}/${URL.repositories}/${userName}/${repoName}`).then(
                response => response.data,
                error => error
            );
        }

        /**
         * Loads data of all repository contributors
         *
         * @param {Object} repo Repository data
         * @returns {Promise} Promise with all contributors data
         */
        function getAllContributors(repo)
        {
            let contributors = [];
            let url = repo['contributors_url'];

            return $q((resolve, reject) =>
            {
                function getPage(page)
                {
                    getContributors(url, page).then(response =>
                    {
                        contributors.push(...response);
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
        function getContributors(url, page)
        {
            let config = {
                params: {
                    per_page: 100,
                    page    : page,
                    anon    : false
                }
            };

            return $http.get(url, config).then(
                response => response.data,
                error => error
            );
        }

        /**
         * Loads user data and his repositories
         *
         * @param {String} login User login
         * @returns {Promise} Promise with user data and first page of his repositories
         */
        function getUserData(login)
        {
            return $http.get(`${URL.main}/${URL.user}/${login}`).then(response =>
                {
                    return getRepos(response.data.repos_url, 30, 1, true).then(data =>
                    {
                        return {user_data: response.data, repos_data: data};
                    }, error => error);
                }, error => error);
        }

        return factory;
    }
}();
