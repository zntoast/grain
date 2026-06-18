.PHONY: build run stop clean

IMAGE_NAME = grain
CONTAINER_NAME = grain-app
HOST_PORT = 8080
CONTAINER_PORT = 80

build:
	docker build -t $(IMAGE_NAME) ./grain-react

run: build
	docker run -d --name $(CONTAINER_NAME) -p $(HOST_PORT):$(CONTAINER_PORT) $(IMAGE_NAME)
	@echo "Running at http://localhost:$(HOST_PORT)"

stop:
	docker stop $(CONTAINER_NAME) && docker rm $(CONTAINER_NAME)

clean: stop
	docker rmi $(IMAGE_NAME)
