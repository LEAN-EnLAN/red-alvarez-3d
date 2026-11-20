# Assets generados con IA

Descomprimí acá el zip que devolvés con las imágenes del `asset-pack/`, respetando las carpetas
(`textures/`, `screens/`, `art/`, ...). Después corré:

    node tools/register-gen.mjs

Eso actualiza `manifest.json` y la app empieza a usar cada imagen presente. Las que faltan siguen
con la versión procedural.
