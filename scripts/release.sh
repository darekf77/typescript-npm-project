cp index.d.ts index.tmp.d.ts
cp $DIST_INDEX index.d.ts
npm version patch
npm publish
cp index.tmp.d.ts index.d.ts
rm index.tmp.d.ts

