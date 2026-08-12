#!/usr/bin/env bash

set -euo pipefail

usage() {
	printf 'Usage: %s <block-slug> [category]\n' "$(basename "$0")" >&2
}

slug_to_title() {
	printf '%s\n' "$1" | awk -F- '{
		for (i = 1; i <= NF; i++) {
			printf "%s%s%s", (i > 1 ? " " : ""), toupper(substr($i, 1, 1)), substr($i, 2)
		}
		printf "\n"
	}'
}

replace_in_file() {
	local search="$1"
	local replacement="$2"
	local file="$3"
	local temporary_file

	temporary_file="$(mktemp "${file}.XXXXXX")"
	sed "s|${search}|${replacement}|g" "$file" > "$temporary_file"
	chmod 0644 "$temporary_file"
	mv "$temporary_file" "$file"
}

if (( $# < 1 || $# > 2 )); then
	usage
	exit 64
fi

name="$1"
category="${2:-components}"

slug_pattern='^[a-z][a-z0-9]*(-[a-z0-9]+)*$'
if [[ ! "$name" =~ $slug_pattern ]]; then
	printf 'Invalid block slug: %s\n' "$name" >&2
	printf 'Use lowercase letters, numbers, and single hyphens.\n' >&2
	exit 64
fi

if [[ ! "$category" =~ $slug_pattern ]]; then
	printf 'Invalid category slug: %s\n' "$category" >&2
	printf 'Use lowercase letters, numbers, and single hyphens.\n' >&2
	exit 64
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source_dir="${script_dir}/_block-base"
destination_dir="${script_dir}/${category}/${name}"

if [[ ! -d "$source_dir" ]]; then
	printf 'Block template not found: %s\n' "$source_dir" >&2
	exit 66
fi

if [[ -e "$destination_dir" ]]; then
	printf 'Destination already exists: %s\n' "$destination_dir" >&2
	exit 73
fi

title="$(slug_to_title "$name")"
namespace="${title// /}"
namespace_key="$(printf '%s' "$namespace" | tr '[:upper:]' '[:lower:]')"

for metadata_file in "$script_dir"/*/*/block.json; do
	[[ -f "$metadata_file" ]] || continue
	existing_block_name="$(sed -nE 's/.*"name"[[:space:]]*:[[:space:]]*"acf\/([^"]+)".*/\1/p' "$metadata_file" | head -n 1)"
	existing_block_key="$(printf '%s' "$existing_block_name" | tr '[:upper:]' '[:lower:]')"
	if [[ "$existing_block_key" == "$name" ]]; then
		printf 'Block name already exists: acf/%s in %s\n' "$name" "$metadata_file" >&2
		exit 73
	fi
done

for init_file in "$script_dir"/*/*/init.php; do
	[[ -f "$init_file" ]] || continue
	existing_namespace="$(sed -nE 's/^namespace[[:space:]]+BaselineBlock([^;]+);/\1/p' "$init_file" | head -n 1)"
	if [[ -n "$existing_namespace" && "$(printf '%s' "$existing_namespace" | tr '[:upper:]' '[:lower:]')" == "$namespace_key" ]]; then
		printf 'Block namespace already exists: BaselineBlock%s in %s\n' "$namespace" "$init_file" >&2
		exit 73
	fi
done

temporary_root="$(mktemp -d "${script_dir}/.porter-block.XXXXXX")"
temporary_block="${temporary_root}/${name}"

cleanup() {
	rm -rf "$temporary_root"
}
trap cleanup EXIT

cp -R "$source_dir" "$temporary_block"

for file in block.json init.php template.php js/block.js scss/style.scss; do
	replace_in_file 'dummy-name' "$name" "${temporary_block}/${file}"
	replace_in_file 'Dummy_Title' "$title" "${temporary_block}/${file}"
	replace_in_file 'DummyNamespace' "$namespace" "${temporary_block}/${file}"
	replace_in_file 'dummyCategory' "$category" "${temporary_block}/${file}"
done

mkdir -p "${temporary_block}/acf-json" "$(dirname "$destination_dir")"
mv "$temporary_block" "$destination_dir"

printf 'Created %s\n' "$destination_dir"
printf 'Next: add an ACF field group and compile the block assets.\n'
