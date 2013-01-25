# Software License Agreement (BSD License)
#
# Copyright (c) 2013, Willow Garage, Inc.
# All rights reserved.
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions
# are met:
#
# * Redistributions of source code must retain the above copyright
# notice, this list of conditions and the following disclaimer.
# * Redistributions in binary form must reproduce the above
# copyright notice, this list of conditions and the following
# disclaimer in the documentation and/or other materials provided
# with the distribution.
# * Neither the name of Willow Garage, Inc. nor the names of its
# contributors may be used to endorse or promote products derived
# from this software without specific prior written permission.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
# "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
# LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
# FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
# COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
# INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
# BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
# LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
# CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
# LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN
# ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
# POSSIBILITY OF SUCH DAMAGE.

'''
The WorldObjectInstanceDatabase class provides functions to natively communicate with a local Mongo 
world object instance database.

@author:  Russell Toris
@version: January 25, 2013
'''

from pymongo import Connection
from pymongo.objectid import ObjectId

class WorldObjectInstanceDatabase(object):
    '''
    The main WorldObjectInstanceDatabase object which communicates with the local Mongo world object
    instance database.
    '''

    def __init__(self):
        '''
        Creates the WorldObjectInstanceDatabase object and connects to the world object instance
        database.
        '''
        # connect to the world model database
        self.mongo = Connection()
        self.db = self.mongo.wm.world_object_instance
        
    def insert(self, entity):
        '''
        Insert the given entity into the world object instance database. This will create a new 
        instance. The instance_id will be set to a unique value and returned.
        
        @param entity: the entity to insert
        @type  entity: dict
        @return: the instance_id
        @rtype: string
        '''
        # generate the ID
        _id = ObjectId()
        instance_id = 'world_object_instance_' + str(_id)
        entity['_id'] = _id
        entity['instance_id'] = instance_id
        self.db.insert(entity)
        # return the instance ID
        return instance_id
            
    def update_entity_by_instance_id(self, instance_id, entity):
        '''
        Update the entity in the world object instance database with the given instance_id, if one
        exists.
        
        @param instance_id: the instance_id of the entity to update
        @type  instance_id: string
        @param entity: the entity to update with
        @type  entity: dict
        @return: if an entity was found and updated with the given instance_id
        @rtype:  bool
        '''
        # check if that id exists and update it
        return self.db.find_and_modify({'instance_id' : instance_id}, {'$set' : entity}) is not None
            
        
    def search__id(self, _id):
        '''
        Search for and return the entity in the world object instance database with the given ID, 
        if one exists. Note that this ID is associated with the internal, database ID, not the 
        instance_id. See search_instance_id instead for this search.
        
        @param _id: the ID of the entity to search for
        @type  _id: string
        @return: the entity found, or None if an invalid ID was given
        @rtype:  dict
        '''
        return self.db.find_one({'_id' : _id})
    
    def search_instance_id(self, instance_id):
        '''
        Search for and return the entity in the world object instance database with the given 
        instance_id, if one exists.
        
        @param instance_id: the instance_id field of the entity to search for
        @type  instance_id: string
        @return: the entity found, or None if an invalid instance_id was given
        @rtype:  dict
        '''
        return self.db.find_one({'instance_id' : instance_id})
    
    def search_tags(self, tags):
        '''
        Search for and return all entities in the world object instance database that contain the
        given list of tags.
        
        @param tags: the list of tags to search for
        @type  tags: list
        @return: the entities found, or None
        @rtype:  pymongo.cursor.Cursor
        '''
        return self.db.find({'tags' : {'$all' : tags}})
    
    def get_world_object_instances(self):
        '''
        Return an array of all the world object instances in the database.

        @return: the list of entities
        @rtype:  pymongo.cursor.Cursor
        '''
        return self.db.find()
    
    def get_tags(self):
        '''
        Return a list of all world object instances model tags.

        @return: the array of tags
        @rtype:  list
        '''
        tags = self.db.find({}, {'tags' : 1})
        # extract the tags
        tag_list = []
        for entity in tags:
            for t in entity['tags']:
                tag_list.append(t)
        # convert to a set to get a unique list
        return list(set(tag_list))
            
