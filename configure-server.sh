# server
apt install git build-essential python
wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
nvm install 9.4 && npm install -g npm
npm install -g check-node-version npm-run@4.1.2\
 rimraf cpr renamer nodemon typescript@2.6.2 increase-memory-limit
ssh-keygen -t rsa -b 4096 -C "darekf77@gmail.com" && cat ~/.ssh/id_rsa.pub
read -n1 -r -p "Please add the ssh key above to your github ssh keys..." key
git clone git@github.com:darekf77/tsc-npm-project.git
cd tsc-npm-project
npm i && tsc && npm link

cd projects/site && tnp build
tnp start &> /dev/null &

