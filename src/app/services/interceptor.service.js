'use strict';

angular.module('app').factory('InterceptorConfig', () =>
{
    let interceptor = {};

    interceptor.request = config =>
    {
        !config.params && (config.params = {});

        config.params.client_id = '8772f6c1cd842984c1af';
        config.params.client_secret = '40b9b29d130d493bc017e8e505b94b2ca1ea70aa';

        return config;
    };

    return interceptor;
});

angular.module('app').config([
    '$httpProvider',
    $httpProvider => $httpProvider.interceptors.push('InterceptorConfig')
]);
