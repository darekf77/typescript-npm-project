# mount samba share as disk
```
sudo mount -t cifs -o username=myUsername,password=myPassword,uid=$(id -u),gid=$(id -g),forceuid,forcegid //192.168.10.100/public /media/sharename
```

```bash
sudo apt-get update && sudo apt-get upgrade

sudo apt-get install git build-essential python gedit
wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
nvm install 9.4
nvm alias default node
npm install -g npm
npm install -g check-node-version npm-run@4.1.2 rimraf cpr renamer nodemon typescript@3.8.3
npm link
ssh-keygen -t rsa -b 4096 -C "darekf77@gmail.com" && cat ~/.ssh/id_rsa.pub
read -n1 -r -p "Please add the ssh key above to your github ssh keys..." key
git clone git@github.com:darekf77/tsc-npm-project.git
cd tsc-npm-project
npm i && tsc && npm link
# increase number of watchers
5
# sudo sysctl fs.inotify.max_user_watches=16384 fix for https://github.com/sass/node-sass/issues/2534 no space left

git config --global user.email "darekf77@gmail.com"
git config --global user.name  "Dariusz"
git config --global core.editor code --wait
# git config --global core.editor "nano"
echo "Client configuration done"

# ==================== set password for ssh server ====================
# locale: Cannot set LC_CTYPE to default locale: No such file or directory
# locale: Cannot set LC_ALL to default locale: No such file or directory
# fix:
# export LC_ALL="en_US.UTF-8"
# ===========================================================

# ==================== vnc server ====================
# https://www.digitalocean.com/community/tutorials/how-to-install-and-configure-vnc-on-debian-9
sudo apt install xfce4 xfce4-goodies
sudo apt install tightvncserver
vncserver
vncserver -kill :1
mv ~/.vnc/xstartup ~/.vnc/xstartup.bak
`tnp bashconfigvncstart` >> ~/.vnc/xstartup
sudo chmod +x ~/.vnc/xstartup
sudo `tnp bashconfigvncservice` >> /etc/systemd/system/vncserver@.service
sudo systemctl daemon-reload
sudo systemctl enable vncserver@1.service
sudo systemctl start vncserver@1
# ===========================================================

# ==================== set password for ssh server ====================
# crate good password for users
sudo apt install openssh-server
# ===========================================================

# ==================== set password for samba ====================
sudo apt-get install samba
smbpasswd -a john
sudo usermod -a -G sambashare john # wil fix issue on debian
# ===========================================================

# ==================== set terminal font ====================
# file " /etc/default/console-setup
# CHARMAP="UTF-8"
# CODESET="Lat7"
# FONTFACE="Terminus"
# FONTSIZE="28x14"
# ===========================================================


# # server
# sudo apt-get update && sudo apt-get upgrade
# sudo apt install git build-essential python
# wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
# export NVM_DIR="$HOME/.nvm"
# [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
# [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
# nvm install 9.4 && npm install -g npm
# npm install -g check-node-version npm-run@4.1.2\
#  rimraf cpr renamer nodemon typescript@2.6.2 increase-memory-limit
# ssh-keygen -t rsa -b 4096 -C "darekf77@gmail.com" && cat ~/.ssh/id_rsa.pub
# read -n1 -r -p "Please add the ssh key above to your github ssh keys..." key
# git clone git@github.com:darekf77/tsc-npm-project.git
# cd tsc-npm-project
# npm i && tsc && npm link
# export LC_ALL="en_US.UTF-8"
# cd projects/site && tnp build
# tnp start 2>&1 >/dev/null &

# samba
useradd dariusz


# open equivalen 
# /usr/share/bin/open
 xdg-open "$1" &> /dev/null &

```

# mesure script time
```bash
time tnp build ss-ui
```


# copy script for dependencies
```bash
rimraf ../tnp/node_modules/`basename \`pwd\`` && cp -R `pwd`/dist ../tnp/node_modules/`basename \`pwd\``
```

# increase number of watchers in linux

```bash
/etc/sysctl.conf -> append fs.inotify.max_user_watches=524288

check command: cat /proc/sys/fs/inotify/max_user_watches
```
