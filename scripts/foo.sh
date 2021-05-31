MODULE_NAME=$( echo $output | jq -r '(.name)' package.json)

echo "MODULE_NAME: ${MODULE_NAME}"

