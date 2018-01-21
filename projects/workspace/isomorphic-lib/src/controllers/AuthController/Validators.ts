
import { isEmail,  isLength } from "validator";
export let isValid = {
    username: (username) => {
        if(username && isLength(username, 3, 50)) return true;
        return false;
    }
}