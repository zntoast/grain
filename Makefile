.PHONY: build run stop restart clean shell logs rebuild dev install

IMAGE_NAME ?= grain
CONTAINER_NAME ?= grain-app
HOST_PORT ?= 8080
CONTAINER_PORT ?= 80

# 可替换为其他国内镜像源
# DOCKER_REGISTRY ?= docker.xuanyuan.me/library
# DOCKER_REGISTRY ?= docker.m.daocloud.io

build:
	docker build -t $(IMAGE_NAME) ./grain-react

# 如果在国内构建慢，可通过 build-mirror 一键指定镜像源
build-mirror:
	docker build \
		--build-arg NPM_REGISTRY=https://registry.npmmirror.com \
		-t $(IMAGE_NAME) ./grain-react

run: build
	docker run -d \
		--name $(CONTAINER_NAME) \
		-p $(HOST_PORT):$(CONTAINER_PORT) \
		--restart unless-stopped \
		$(IMAGE_NAME)
	@echo "Running at http://localhost:$(HOST_PORT)"

stop:
	-docker stop $(CONTAINER_NAME)
	-docker rm $(CONTAINER_NAME)

restart: stop run

clean:
	-docker stop $(CONTAINER_NAME)
	-docker rm $(CONTAINER_NAME)
	-docker rmi $(IMAGE_NAME)

shell:
	docker exec -it $(CONTAINER_NAME) sh

logs:
	docker logs -f $(CONTAINER_NAME)

rebuild: clean build run

# ---- 开发相关 ----
install:
	cd grain-react && npm install --registry=https://registry.npmmirror.com

dev:
	cd grain-react && npm run dev
