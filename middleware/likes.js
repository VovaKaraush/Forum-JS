import { db } from '../middleware/database.js';

function userLiked(userId, postId){
    try {
        const like = db.prepare(
            'SELECT * FROM likes where user_id=? AND target_id=?'
        ).get(userId, postId);
        console.log(like);
        if (like){
            db.prepare(
                'DELETE FROM likes where user_id=? AND target_id=?'
            ).run(userId, postId);
            return false;
        } else if (!like){
            db.prepare(
                'INSERT INTO likes (user_id, target_id) VALUES (?, ?)'
            ).run(userId, postId);
            return true;
        }
    } catch (error) {
        console.error("une erreur est arrivée :", error);
    }
    

}

export default userLiked;