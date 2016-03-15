(function () {
    "use strict";
    angular
        .module("RTrack", [
            'restangular',
            'ngSanitize',
            'ui.select',
            'angularMoment'
        ])
        .factory("csrfInterceptor", csrfInterceptor)
        .config(config);

    /**
     * @param $httpProvider
     * @param RestangularProvider
     */
    function config($httpProvider, RestangularProvider) {
        $httpProvider.interceptors.push('csrfInterceptor');
        RestangularProvider.setBaseUrl('http://rtrack.localhost:5000/api');
        RestangularProvider.setRequestSuffix('/');
        RestangularProvider.setDefaultHeaders({'Content-Type': 'application/json'});
    }
    config.$inject = ["$httpProvider", "RestangularProvider"];

    function csrfInterceptor($injector) {
        return {
            response: function (response) {
                var token = response.headers()['x-csrf-token'],
                    $http = $injector.get("$http");
                if (!!token) {
                    $http.defaults.headers.common['X-CSRF-Token'] = token;
                }
                return response;
            }
        }
    }
    csrfInterceptor.$inject = ["$injector"];

})();