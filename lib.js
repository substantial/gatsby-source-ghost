module.exports.getImagesFromApiResults = results => results
    .reduce((acc, entities) => acc.concat(entities))
    .reduce((acc, entity) => acc.concat([
        entity.feature_image,
        entity.cover_image,
        entity.profile_image
    ]), [])
    .filter(url => !!url)
    .map(url => ({id: url, src: url}));
