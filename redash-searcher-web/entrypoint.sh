#!/bin/sh
# This is workaround to set public environment variables from runtime
# ref: https://dev.to/itsrennyman/manage-nextpublic-environment-variables-at-runtime-with-docker-53dl

echo "Check that we have NEXT_PUBLIC_REDASH__URL vars"
test -n "$NEXT_PUBLIC_REDASH__URL"
test -n "$NEXT_PUBLIC_APP__URL"

find /app/.next \( -type d -name .git -prune \) -o -type f -print0 | xargs -0 sed -i "s#APP_NEXT_PUBLIC_REDASH__URL#$NEXT_PUBLIC_REDASH__URL#g"
find /app/.next \( -type d -name .git -prune \) -o -type f -print0 | xargs -0 sed -i "s#APP_NEXT_PUBLIC_APP__URL#$NEXT_PUBLIC_APP__URL#g"

exec "$@"
