function Room(name, id, owner,roomType) {
    this.name = name;
    this.id = id;
    this.interValId = null;
    this.owner = owner;
    this.status = "available";
    this.people = [];
    this.private = false;
    this.roomType = roomType;
};

Room.prototype.addPerson = function(personID) {
    if (this.status === "available") {
        this.people.push(personID);
    }
};

Room.prototype.removePerson = function(person) {
    var personIndex = -1;
    for(var i = 0; i < this.people.length; i++){
        if(this.people[i].id === person.id){
            personIndex = i;
            break;
        }
    }
    this.people.remove(personIndex);
};

Room.prototype.getPerson = function(personID) {
    var person = null;
    for(var i = 0; i < this.people.length; i++) {
        if(this.people[i].id == personID) {
            person = this.people[i];
            break;
        }
    }
    return person;
};


module.exports = Room;