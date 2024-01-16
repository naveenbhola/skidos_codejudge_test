  #!/bin/bash
  error_string=$1
  echo "In error handler: $error_string"
  repo_details=$(env | grep GITPOD_REPO_ROOTS | cut -d'=' -f2)
  IFS='-' read -ra arr <<< "$repo_details"
  ques_id="${arr[1]}"
  uuid="${arr[3]}"
  request_body="error : $error_string, uuid : $uuid, ques_id : $ques_id"
  data="{
      \"stacktrace\":\"$request_body\",
      \"requestMethod\":\"POST\",
      \"requestUrl\":\"GITPOD\",
      \"requestId\":\"$uuid\",
      \"ExceptionSource\":\"HTTP\",
      \"name\":\"GITPOD\",
      \"jobName\":\"$uuid\"
  }"
  echo "Invoking notification service, notifying about error.."
  RESPONSE=`curl --location --request POST http://notification.codejudge.io/notification/app/send-exception-email --header 'Content-Type: application/json' --data-raw "$data"`
  echo "Sent error notification"
