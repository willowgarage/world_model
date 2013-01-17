'''
The Native class provides functions to natively communicate with a
local world model database in mongo.

@author:  Russell Toris
@version: January 17, 2013
'''

from pymongo import Connection

class Native(object):
    '''
    The main Native object which communicates with the local mongodb.
    '''

    def __init__(self):
        '''
        Creates the Native object and connects to the world model database.
        '''
        # connect to the world model database
        self.mongo = Connection()
        self.db = self.mongo.wm
        self.world = self.db.world
        
    def insert(self, entity):
        '''
        Insert the given entity into the world model database.
        
        @param entity: the entity to insert
        @type  entity: dict
        '''
        # check if any information was given
        if len(entity) > 0:
            self.world.insert(entity)
            
    def update_entity(self, _id, entity):
        '''
        Update the entity in the world model with the given ID, if one exists.
        
        @param _id: the ID of the entity to update
        @type  _id: string
        @param entity: the entity to update with
        @type  entity: dict
        @return: if an entity was found and updated with the given ID
        @rtype:  bool
        '''
        # check if that id exists
        updated = self.world.find_and_modify({'_id':_id}, {'$set' : entity})
        return updated is None
            
        
    def search__id(self, _id):
        '''
        Search for and return the entity in the world model with the given ID, if one exists.
        
        @param _id: the ID of the entity to search for
        @type  _id: string
        @return: the entity found, or None if an invalid ID was given
        @rtype:  dict
        '''
        return self.world.find_one({'_id' : _id})
    
    def search_name(self, name):
        '''
        Search for and return the entity in the world model with the given name, if one exists.
        
        @param name: the name field of the entity to search for
        @type  name: string
        @return: the entity found, or None if an invalid name was given
        @rtype:  dict
        '''
        return self.world.find_one({'name' : name})
            