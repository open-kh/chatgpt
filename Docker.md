## Install docker
`sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin`
or
`sudo apt-get install docker.io`

## Give permission to PC
`sudo usermod -aG docker $(whoami)`

Reboot PC system
`sudo reboot`

## Setup Docker

`sudo docker network ls`
```
NETWORK ID      NAME    DRIVER
2f259bab93aa    bridge  bridge
2f259bab93ab    host    host
2f259bab93ab    none    null
```

Create docker

`sudo docker run -itd --rm --name thor busybox`
`sudo docker run -itd --rm --name mjolnir busybox`
`sudo docker run -itd --rm --name stormbreaker nginx`

## Link bridge
`bridge link`

Showing bridge
`sudo docker inspect bridge`

run docker
`sudo docker exec -it thor sh`

run nginx

`sudo docker stop stormbreaker`

run nginx with port 80:80
`sudo docker run -itd --rm -p 80:80 --name stormbreaker nginx`

show docker
`sudo docker ps`


create network
`sudo docker network create asgard`

show ip network asgard
`ip a`

<!-- to remove network asgard -->
`sudo docker run -itd --rm --network asgard --name loki busybox`
`sudo docker run -itd --rm --network asgard --name odin busybox`

show ip network asgard
`ip address show`

merge network asgard to the bridge network
`bridge link`

show inspect of asgard network
`sudo docker inspect asgard`

Show thor ping to loki

`sudo docker exec -it thor sh`

```
ping 172.18.0.2 //ip loki or ping loki
```

to host stormbreaker
`sudo docker stop stormbreaker`
`sudo docker rn -itd --rm --network host --name stormbreaker nginx`

 




`sudo docker network connect podman thor`

`sudo docker exec -it thor ip a`

`sudo docker exec -it thor ip route`

`sudo docker exec -it thor ip route show table local`

`sudo docker exec -it thor ip route show table main`



