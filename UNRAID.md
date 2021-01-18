# override iommiu
```
pcie_acs_override=downstream 
```

# instalation of macos vm (macinabox)

ONE CONTAINER - ONE INSTALATION

delete vm
```
virsh undefine --nvram "name of VM"
```

set default network
```
virsh net-start default
```
nerd pack plugin and then install netcat-openbsd.



<source bridge='br0'/>
to 
<source bridge='virbr0'/>

1_macinabox_helper - change name


# restart amd graphic card

```
#!/bin/bash

virsh shutdown "Ubuntu (gaming)"
echo "sleeping 15s"
sleep 15
echo "disconnecting amd graphics"
echo "1" | tee -a /sys/bus/pci/devices/0000\:03\:00.0/remove
echo "disconnecting amd sound counterpart"
echo "1" | tee -a /sys/bus/pci/devices/0000\:03\:00.1/remove
echo "entered suspended state... after 10s server is going to automatically wake up"
rtcwake -m mem --local -s 10
# echo -n mem > /sys/power/state
echo "reconnecting amd gpu and sound counterpart"
echo "1" | tee -a /sys/bus/pci/rescan
echo "AMD graphics card sucessfully reset"
virsh start "Ubuntu (gaming)"

```


# creating vdisk with preallocalted size

```
qemu-img create -f raw -o preallocation=full /mnt/user/steam-ubuntu/steam-ubuntu.ing 150G
```
