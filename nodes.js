const createNodeHelpers = require('gatsby-node-helpers').default;
const {createRemoteFileNode} = require('gatsby-source-filesystem');

const TYPE_PREFIX = 'Ghost';
const {createNodeFactory, generateNodeId} = createNodeHelpers({
    typePrefix: TYPE_PREFIX
});

const POST = 'Post';
const PAGE = 'Page';
const TAG = 'Tag';
const AUTHOR = 'Author';
const SETTINGS = 'Settings';
const MEDIA = 'Media';

async function downloadImageAndCreateFileNode(
    {url},
    {createNode, createNodeId, touchNode, store, cache}
) {
    let fileNodeID;

    const mediaDataCacheKey = `${TYPE_PREFIX}__Media__${url}`;
    const cacheMediaData = await cache.get(mediaDataCacheKey);

    if (cacheMediaData) {
        fileNodeID = cacheMediaData.fileNodeID;
        touchNode({nodeId: fileNodeID});
        return fileNodeID;
    }

    const fileNode = await createRemoteFileNode({
        url,
        store,
        cache,
        createNode,
        createNodeId
    });

    if (fileNode) {
        fileNodeID = fileNode.id;
        await cache.set(mediaDataCacheKey, {fileNodeID});
        return fileNodeID;
    }
}

function mapPostToTags(post, tags) {
    const postHasTags =
        post.tags && Array.isArray(post.tags) && post.tags.length;

    if (postHasTags) {
        // replace tags with links to their nodes
        post.tags___NODE = post.tags.map(t => generateNodeId(TAG, t.id));

        // add a backreference for this post to the tags
        post.tags.forEach(({id: tagId}) => {
            const tag = tags.find(t => t.id === tagId);
            if (!tag.posts___NODE) {
                tag.posts___NODE = [];
            }
            tag.posts___NODE.push(post.id);
        });

        // replace primary_tag with a link to the tag node
        if (post.primary_tag) {
            post.primary_tag___NODE = generateNodeId(TAG, post.primary_tag.id);
        }

        delete post.tags;
        delete post.primary_tag;
    }
}

function mapPageToTags(page, tags) {
    const pageHasTags =
        page.tags && Array.isArray(page.tags) && page.tags.length;

    if (pageHasTags) {
        // replace tags with links to their nodes
        page.tags___NODE = page.tags.map(t => generateNodeId(TAG, t.id));

        // add a backreference for this post to the tags
        page.tags.forEach(({id: tagId}) => {
            const tag = tags.find(t => t.id === tagId);
            if (!tag.pages___NODE) {
                tag.pages___NODE = [];
            }
            tag.pages___NODE.push(page.id);
        });

        // replace primary_tag with a link to the tag node
        if (page.primary_tag) {
            page.primary_tag___NODE = generateNodeId(TAG, page.primary_tag.id);
        }

        delete page.tags;
        delete page.primary_tag;
    }
}

function mapPostToAuthors(post, authors) {
    const postHasAuthors =
        post.authors && Array.isArray(post.authors) && post.authors.length;

    if (postHasAuthors) {
        // replace authors with links to their nodes
        post.authors___NODE = post.authors.map(a => generateNodeId(AUTHOR, a.id));

        // add a backreference for this post to the author
        post.authors.forEach(({id: authorId}) => {
            const author = authors.find(u => u.id === authorId);
            if (!author.posts___NODE) {
                author.posts___NODE = [];
            }
            author.posts___NODE.push(post.id);
        });

        // replace primary_author with a link to the author node
        if (post.primary_author) {
            post.primary_author___NODE = generateNodeId(
                AUTHOR,
                post.primary_author.id
            );
        }

        delete post.authors;
        delete post.primary_author;
    }
}

function mapPageToAuthors(page, authors) {
    const pageHasAuthors =
        page.authors && Array.isArray(page.authors) && page.authors.length;

    if (pageHasAuthors) {
        // replace authors with links to their nodes
        page.authors___NODE = page.authors.map(a => generateNodeId(AUTHOR, a.id));

        // add a backreference for this post to the author
        page.authors.forEach(({id: authorId}) => {
            const author = authors.find(u => u.id === authorId);
            if (!author.pages___NODE) {
                author.pages___NODE = [];
            }
            author.pages___NODE.push(page.id);
        });

        // replace primary_author with a link to the author node
        if (page.primary_author) {
            page.primary_author___NODE = generateNodeId(
                AUTHOR,
                page.primary_author.id
            );
        }

        delete page.authors;
        delete page.primary_author;
    }
}

async function mapImagesToMedia(node) {
    if (node.feature_image) {
        node.feature_image___NODE = generateNodeId(MEDIA, node.feature_image);
        delete node.feature_image;
    }

    if (node.profile_image) {
        node.profile_image___NODE = generateNodeId(MEDIA, node.profile_image);
        delete node.profile_image;
    }

    if (node.cover_image) {
        node.cover_image___NODE = generateNodeId(MEDIA, node.cover_image);
        delete node.cover_image;
    }

    if (node.og_image) {
        node.og_image___NODE = generateNodeId(MEDIA, node.og_image);
        delete node.og_image;
    }

    if (node.twitter_image) {
        node.twitter_image___NODE = generateNodeId(MEDIA, node.twitter_image);
        delete node.twitter_image;
    }
}

function addPostCountToTag(tag, posts) {
    tag.postCount = posts.reduce((acc, post) => {
        const postHasTag = post.tags && !!post.tags.find(pt => tag.ghostId === pt.id);
        return postHasTag ? acc + 1 : acc;
    }, 0);
    delete tag.count;
}

function addPostCountToAuthor(author, posts) {
    author.postCount = posts.reduce((acc, post) => {
        const postHasAuthor = post.authors && !!post.authors.find(pa => author.ghostId === pa.id);
        return postHasAuthor ? acc + 1 : acc;
    }, 0);
    delete author.count;
}

async function createLocalFileFromMedia(node, imageArgs) {
    node.localFile___NODE = await downloadImageAndCreateFileNode(
        {url: node.src.split('?')[0]},
        imageArgs
    );
}

module.exports.createNodeFactories = ({posts, tags, authors}, imageArgs) => {
    const postNodeMiddleware = (node) => {
        mapPostToTags(node, tags);
        mapPostToAuthors(node, authors);
        mapImagesToMedia(node);
        return node;
    };

    const pageNodeMiddleware = (node) => {
        mapPageToTags(node, tags);
        mapPageToAuthors(node, authors);
        mapImagesToMedia(node);
        return node;
    };

    const tagNodeMiddleware = (node) => {
        addPostCountToTag(node, posts);
        mapImagesToMedia(node);
        return node;
    };

    const authorNodeMiddleware = (node) => {
        addPostCountToAuthor(node, posts);
        mapImagesToMedia(node);
        return node;
    };

    const mediaNodeMiddleware = async (node) => {
        await createLocalFileFromMedia(node, imageArgs);
        return node;
    };

    const PostNode = createNodeFactory(POST, postNodeMiddleware);
    const PageNode = createNodeFactory(PAGE, pageNodeMiddleware);
    const TagNode = createNodeFactory(TAG, tagNodeMiddleware);
    const AuthorNode = createNodeFactory(AUTHOR, authorNodeMiddleware);
    const SettingsNode = createNodeFactory(SETTINGS);
    const MediaNode = createNodeFactory(MEDIA, mediaNodeMiddleware);

    return {
        PostNode,
        PageNode,
        TagNode,
        AuthorNode,
        SettingsNode,
        MediaNode
    };
};
