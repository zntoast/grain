.PHONY: build run stop restart clean shell logs rebuild dev install start stop-server restart-server

IMAGE_NAME ?= grain
CONTAINER_NAME ?= grain-app
HOST_PORT ?= 8080
CONTAINER_PORT ?= 80

# ============================================================
# Docker
# ============================================================

build:
	docker build -t $(IMAGE_NAME) ./grain-react

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

# ============================================================
# 原生 Linux 部署（不使用 Docker）
# ============================================================

install:
	cd grain-react && npm install --registry=https://registry.npmmirror.com

dev:
	cd grain-react && npm run dev

NATIVE_PORT ?= 8080
PID_FILE := .serve.pid

start: build-native
	@echo "Starting on port $(NATIVE_PORT)..."
	npx serve -l $(NATIVE_PORT) -s grain-react/dist &
	@echo $$! > $(PID_FILE)
	@echo "Running at http://localhost:$(NATIVE_PORT) (PID $$(cat $(PID_FILE)))"

build-native:
	cd grain-react && npm run build

stop-server:
	@if [ -f $(PID_FILE) ]; then \
		kill $$(cat $(PID_FILE)) 2>/dev/null || true; \
		rm -f $(PID_FILE); \
		echo "Stopped"; \
	else \
		echo "No PID file found"; \
	fi

restart-server: stop-server start
