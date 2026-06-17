#!/usr/bin/env bash
# =============================================================================
# lib/set-field-value.sh
# 设置单条 issue 的某个字段值 (GraphQL mutation)
# 用法: set_field_value <project_id> <item_id> <field_id> <value_type> <value>
#   value_type: single_select | number | date | text
# =============================================================================

set_field_value() {
  local project_id="$1"
  local item_id="$2"
  local field_id="$3"
  local value_type="$4"
  local value="$5"
  
  case "$value_type" in
    single_select)
      local mutation=$(cat <<GQL
mutation {
  updateProjectV2ItemFieldValue(input: {
    projectId: "$project_id"
    itemId: "$item_id"
    fieldId: "$field_id"
    value: { singleSelectOptionId: "$value" }
  }) {
    projectV2Item { id }
  }
}
GQL
)
      gh api graphql -f query="$mutation" --jq '.data.updateProjectV2ItemFieldValue.projectV2Item.id // empty' >/dev/null 2>&1
      ;;
    number)
      local mutation=$(cat <<GQL
mutation {
  updateProjectV2ItemFieldValue(input: {
    projectId: "$project_id"
    itemId: "$item_id"
    fieldId: "$field_id"
    value: { number: $value }
  }) {
    projectV2Item { id }
  }
}
GQL
)
      gh api graphql -f query="$mutation" --jq '.data.updateProjectV2ItemFieldValue.projectV2Item.id // empty' >/dev/null 2>&1
      ;;
    date)
      local mutation=$(cat <<GQL
mutation {
  updateProjectV2ItemFieldValue(input: {
    projectId: "$project_id"
    itemId: "$item_id"
    fieldId: "$field_id"
    value: { date: "$value" }
  }) {
    projectV2Item { id }
  }
}
GQL
)
      gh api graphql -f query="$mutation" --jq '.data.updateProjectV2ItemFieldValue.projectV2Item.id // empty' >/dev/null 2>&1
      ;;
    text)
      local mutation=$(cat <<GQL
mutation {
  updateProjectV2ItemFieldValue(input: {
    projectId: "$project_id"
    itemId: "$item_id"
    fieldId: "$field_id"
    value: { text: "$value" }
  }) {
    projectV2Item { id }
  }
}
GQL
)
      gh api graphql -f query="$mutation" --jq '.data.updateProjectV2ItemFieldValue.projectV2Item.id // empty' >/dev/null 2>&1
      ;;
  esac
}

# 获取 single select 字段的所有 options
# 用法: get_field_options <project_id> <field_id> > /tmp/options.tsv
#   输出格式: option_name<TAB>option_id
get_field_options() {
  local project_id="$1"
  local field_id="$2"
  
  gh api graphql -f query='
    query($projectId: ID!) {
      node(id: $projectId) {
        ... on ProjectV2 {
          fields(first: 30) {
            nodes {
              ... on ProjectV2SingleSelectField {
                id
                name
                options { id name }
              }
            }
          }
        }
      }
    }' -f projectId="$project_id" --jq '
      .data.node.fields.nodes[]
      | select(.id == "'"$field_id"'")
      | .options[]
      | "\(.name)\t\(.id)"
    ' 2>/dev/null
}

# 获取 item ID (从 issue 编号)
# 用法: get_item_id <owner> <repo> <issue_num>
get_item_id() {
  local owner="$1"
  local repo="$2"
  local issue_num="$3"
  
  gh api graphql -f query='
    query($owner: String!, $repo: String!, $num: Int!) {
      repository(owner: $owner, name: $repo) {
        issue(number: $num) {
          projectItems(first: 1) {
            nodes { id }
          }
        }
      }
    }' -f owner="$owner" -f repo="$repo" -F num="$issue_num" \
    --jq '.data.repository.issue.projectItems.nodes[0].id // empty' 2>/dev/null
}
