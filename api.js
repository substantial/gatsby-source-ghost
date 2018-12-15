const axios = require('axios');
const qs = require('qs');

const printError = (...args) => console.error('\n', ...args); // eslint-disable-line no-console

const validatePluginOptions = (options) => {
    if (!options.clientId || !options.clientSecret || !options.apiUrl) {
        printError('Plugin Configuration Missing: gatsby-source-ghost requires your apiUrl, clientId and clientSecret');
        process.exit(1);
    }

    if (options.apiUrl.substring(0, 4) !== 'http') {
        printError('Ghost apiUrl requires a protocol, E.g. https://<yourdomain>.ghost.io');
        process.exit(1);
    }

    if (options.apiUrl.substring(0, 8) !== 'https://') {
        printError('Ghost apiUrl should be served over HTTPS, are you sure you want:', options.apiUrl, '?');
    }
};

const buildApiConfigFromOptions = options => ({
    baseApiUrl: `${options.apiUrl}/ghost/api/v0.1`,
    baseApiOptions: {
        client_id: options.clientId,
        client_secret: options.clientSecret,
        absolute_urls: true,
        limit: 'all'
    }
});

const get = (url, successCallback) => axios.get(url)
    .then(successCallback)
    .catch((err) => {
        printError('Error:', err);
        printError('Unable to fetch data from your Ghost API. Perhaps your credentials or apiUrl are incorrect?');
        process.exit(1);
    });

module.exports.fetchAllPosts = (options) => {
    validatePluginOptions(options);

    const {baseApiUrl, baseApiOptions} = buildApiConfigFromOptions(options);
    const postApiOptions = Object.assign({}, baseApiOptions, {
        include: 'authors,tags',
        filter: 'page:[true,false]',
        formats: 'plaintext,html'
    });
    const postsApiUrl = `${baseApiUrl}/posts/?${qs.stringify(postApiOptions)}`;

    return get(postsApiUrl, res => res.data.posts);
};

module.exports.fetchAllTags = (options) => {
    validatePluginOptions(options);

    const {baseApiUrl, baseApiOptions} = buildApiConfigFromOptions(options);
    const postApiOptions = Object.assign({}, baseApiOptions, {
        absolute_urls: true,
        limit: 'all'
    });
    const tagsApiUrl = `${baseApiUrl}/tags/?${qs.stringify(postApiOptions)}`;

    return get(tagsApiUrl, res => res.data.tags);
};

module.exports.fetchAllUsers = (options) => {
    validatePluginOptions(options);

    const {baseApiUrl, baseApiOptions} = buildApiConfigFromOptions(options);
    const postApiOptions = Object.assign({}, baseApiOptions, {
        absolute_urls: true,
        limit: 'all'
    });
    const usersApiUrl = `${baseApiUrl}/users/?${qs.stringify(postApiOptions)}`;

    return get(usersApiUrl, res => res.data.users);
};
