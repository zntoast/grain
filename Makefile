.PHONY: build run stop restart clean shell logs rebuild dev install i r rs s

IMAGE_NAME ?= grain
CONTAINER_NAME ?= grain-app
HOST_PORT ?= 8080
CONTAINER_PORT ?= 80

# ============================================================
# Docker
# ============================================================

build:
	docker build -t $(IMAGE_NAME) ./grain-react

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
LOG_FILE := .serve.log

build-native:
	cd grain-react && npm run build

# 后台启动（终端关闭不影响）
i: build-native
	@nohup npx serve -l $(NATIVE_PORT) -s grain-react/dist > $(LOG_FILE) 2>&1 &
	@echo $$! > $(PID_FILE)
	@sleep 1
	@echo "✓ http://localhost:$(NATIVE_PORT) (PID $$(cat $(PID_FILE)))"

# 停止
s:
	@if [ -f $(PID_FILE) ]; then \
		kill $$(cat $(PID_FILE)) 2>/dev/null || true; \
		rm -f $(PID_FILE); \
		echo "✓ Stopped"; \
	else \
		echo "Not running"; \
	fi

# 重启：拉取最新代码 + 重新构建 + 后台启动
rs: s
	@git pull
	@cd grain-react && npm install --registry=https://registry.npmmirror.com --silent
	@cd grain-react && npm run build
	@nohup npx serve -l $(NATIVE_PORT) -s grain-react/dist > $(LOG_FILE) 2>&1 &
	@echo $$! > $(PID_FILE)
	@sleep 1
	@echo "✓ http://localhost:$(NATIVE_PORT) (PID $$(cat $(PID_FILE)))"

# 查看日志
l:
	@cat $(LOG_FILE) 2>/dev/null || echo "No logs"
