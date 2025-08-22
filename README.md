# Stencil Experiment

HTML with graphql bindings -> Analyze DOM -> Generate / Execute Query -> Render Results into HTML


### Apollo Client Error Reproduction Steps

```bash

# Install hasura CLI (if you don't have it)
curl -L https://github.com/hasura/graphql-engine/raw/stable/cli/get.sh | bash

# start docker compose (postgres, hasura)
docker-compose up -d

# run migrations
./migrate.sh

# run the demo app
cd stencil
bun install
bun run dev
```

Open http://localhost:3001 in the browser, check console, check Apollo devtools (see error)
