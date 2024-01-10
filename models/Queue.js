
class Queue {
    constructor() {
        this.items = [];
        this.processed = [];
    }

    set_into_queue(item) {
        this.items.push(item);
    }

    dequeue() {
        return this.items.length ? this.items.shift() : null;
    }

    size() {
        return this.items.length;
    }

    exists(itemId){
        return this.items.some(item => item.messageId === itemId)
    }

    show() {
        console.log('QUEUE: ',this.items);
        return
    }
    setProcessed(id){
        this.processed.push(id)
    }

    isProcessed(id){
        return this.processed.includes(id)
    }

}

module.exports = Queue;