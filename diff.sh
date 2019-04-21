ls -1 /home/darek/projects/npm/tsc-npm-project/node_modules > tmp-tnp.txt
ls -1 /home/darek/projects/npm/tsc-npm-project/tmp-tests-context/tnp-install---should-install-worksapce-packages/test1/node_modules > tmp-test1.txt
diff -u  tmp-test1.txt tmp-tnp.txt > tmp-out.txt
