# GENERAL RULES
 - single pci passthrough -> super problem, igpu is best solution
 - (windwo vm) Q35 better for instalation
 - be aware of unstable things
      - usb ports
      - sata ports
      - pendrive
      - hot chipset


# override iommiu
```
pcie_acs_override=downstream,multifunction 
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


ONLY FOR ERROR: error: Cannot get interface MTU on 'br0': No such device
<source bridge='br0'/>
to 
<source bridge='virbr0'/>

1_macinabox_helper - change name


# restart amd graphic card

```

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

# converting disk
```
# copy vdisk to physical disk.   
dd if="location/of/vdisk" of=/dev/sdX

# copy physical disk to vdisk.   
qemu-img convert -p -O raw /dev/sdx "/mnt/user/domains/test/vdisk1.img"
```


# passthrough whole disk
```
/dev/disk/by-id/ata-CT1000P1SSD8_1946E227AC55
/dev/disk/by-id/ata-Samsung_SSD_870_QVO_1TB_S5SVNG0NB06963M
/dev/disk/by-id/ata-Samsung_SSD_850_EVO_250GB_S21PNSAG621562Z
/dev/disk/by-id/ata-Samsung_SSD_860_EVO_500GB_S3Z2NB0M704344P
/dev/disk/by-id/ata-5AS_20150626
```

# shrink vdisk
```
qemu-img resize my.img 74G

```

# nvme crucial passthrough
```xml
<domain type='kvm' xmlns:qemu='http://libvirt.org/schemas/domain/qemu/1.0'>
...
    <hostdev mode='subsystem' type='pci' managed='yes'>
      <source>
        <address domain='0x0000' bus='0x01' slot='0x00' function='0x0'/>
      </source>
      <alias name='ua-sm2262'/> 
      <address type='pci' domain='0x0000' bus='0x02' slot='0x00' function='0x0'/>
    </hostdev>
...
  <qemu:commandline>
    <qemu:arg value='-set'/>
    <qemu:arg value='device.ua-sm2262.x-msix-relocation=bar2'/>
  </qemu:commandline>
```

