case "$OSTYPE" in
  linux*)   echo "Linux / WSL" ;;
  darwin*)  echo "Mac OS" ;;
  win*)     echo "Windows" ;;
  msys*)    echo "MSYS / MinGW / Git Bash" ;;
  cygwin*)  echo "Cygwin" ;;
  bsd*)     echo "BSD" ;;
  solaris*) echo "Solaris" ;;
  *)        echo "unknown: $OSTYPE" ;;
esac

# todo configura mac/wsl/linux/server whatere and quick
