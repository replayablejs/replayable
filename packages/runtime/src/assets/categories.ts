/** Categories produced from one selected source file per logical asset. */
export const simpleAssetCategories = ['sprites', 'textures', 'sounds', 'fonts', 'locales'] as const;

/** Categories assembled from several related source files. */
export const groupedAssetCategories = ['atlases', 'spines', 'shaders'] as const;

/** Every generated asset category understood by the playable runtime. */
export const assetCategories = [...simpleAssetCategories, ...groupedAssetCategories] as const;
