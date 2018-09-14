git pull origin master
rimraf dist && tsc
cd projects/site
tnp start &
cd ../..
