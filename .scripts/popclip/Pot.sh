curl -Lsd "$POPCLIP_TEXT" "127.0.0.1:60606"

if [ $? -eq 0 ]; then
    exit 0
else
    open -g -a saladict
    sleep 2
    curl -Lsd "$POPCLIP_TEXT" "127.0.0.1:60606/translate"
fi