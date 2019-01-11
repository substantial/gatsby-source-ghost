const axios = require('axios');
const qs = require('qs');

const reset = '\x1b[0m';
const printWarning = (...args) => console.error('\n\x1b[33m', ...args, reset); // eslint-disable-line no-console
const printError = (...args) => console.error('\n\x1b[41m\x1b[37m', ...args, reset); // eslint-disable-line no-console
const printAPIError = ({message, context, errorType}) => console.error('\n\x1b[31m', errorType + ':', message, context || '', reset); // eslint-disable-line no-console

const validateOptions = ({clientId, clientSecret, apiUrl}) => {
    if (!clientId || !clientSecret || !apiUrl) {
        printError('Plugin Configuration Missing: gatsby-source-ghost requires your apiUrl, clientId and clientSecret');
        process.exit(1);
    }

    if (apiUrl.substring(0, 4) !== 'http') {
        printError('Ghost apiUrl requires a protocol, E.g. https://<yourdomain>.ghost.io');
        process.exit(1);
    }

    if (apiUrl.substring(0, 8) !== 'https://') {
        printWarning('Ghost apiUrl should be served over HTTPS, are you sure you want:', apiUrl, '?');
    }
};

const exitOnApiError = (error) => {
    if (error.response && error.response.data && error.response.data.errors) {
        printAPIError(error.response.data.errors[0]);
    } else {
        printError('Error:', error.message);
    }

    printError('Unable to fetch data from your Ghost API. Perhaps your credentials or apiUrl are incorrect?');
    process.exit(1);
};

const createApiHelpers = ({clientId, clientSecret, apiUrl}) => {
    const baseApiUrl = `${apiUrl}/ghost/api/v0.1`;

    const baseApiParams = {
        client_id: clientId,
        client_secret: clientSecret,
        absolute_urls: true,
        limit: 'all'
    };

    const extendParams = params => Object.assign({}, baseApiParams, params);

    const buildApiUrl = (endpoint, params = {}) => {
        const query = qs.stringify(extendParams(params));
        return `${baseApiUrl}/${endpoint}/?${query}`;
    };

    return {
        extendParams,
        buildApiUrl
    };
};

module.exports.fetchAllPosts = (options) => {
    validateOptions(options);

    const {buildApiUrl} = createApiHelpers(options);
    const postsUrl = buildApiUrl('posts', {
        include: 'authors,tags',
        filter: 'page:[true,false]',
        formats: 'plaintext,html'
    });

    return axios.get(postsUrl)
        .then(res => res.data.posts)
        .catch(exitOnApiError);
};

module.exports.fetchAllTags = (options) => {
    validateOptions(options);

    const {buildApiUrl} = createApiHelpers(options);
    const tagsUrl = buildApiUrl('tags');

    return axios.get(tagsUrl)
        .then(res => res.data.tags)
        .catch(exitOnApiError);
};

module.exports.fetchAllUsers = (options) => {
    validateOptions(options);

    const {buildApiUrl} = createApiHelpers(options);
    const usersUrl = buildApiUrl('users');

    return axios.get(usersUrl)
        .then(res => res.data.users)
        .catch(exitOnApiError);
};
