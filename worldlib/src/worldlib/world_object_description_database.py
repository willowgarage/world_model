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
The WorldObjectDescriptionDatabase class provides functions to natively communicate with a 
PostgreSQL world model database for the world_object_descriptions table.

@author:  Russell Toris
@version: February 10, 2013
'''

from pymongo import Connection
from pymongo.objectid import ObjectId
from gridfs import GridFS
import pickle

class WorldObjectDescriptionDatabase(object):
    '''
    The main WorldObjectDescriptionDatabase object which communicates with the local Mongo world
    object description database.
    '''

    def __init__(self):
        '''
        Creates the WorldObjectDescriptionDatabase object and connects to the world object 
        description database.
        '''
        # connect to the world model database
        mongo = Connection()
        wm = mongo.wm
        self.db = wm.world_object_description
        self.fs = GridFS(wm)
        
    def insert(self, entity):
        '''
        Insert the given entity into the world object description database. This will create a new 
        description. The description_id will be set to a unique value and returned. Since
        descriptions are likely to be large, they will be saved to the gridfs.
        
        @param entity: the entity to insert
        @type  entity: dict
        @return: the description_id
        @rtype: string
        '''
        # generate the ID
        _id = ObjectId()
        description_id = 'world_object_description_' + str(_id)
        entity['description_id'] = description_id 
        
        # save it to the fs and store the pointer
        ptr = {}
        ptr['_id'] = _id
        ptr['description_id'] = description_id
        ptr['file_id'] = self.fs.put(pickle.dumps(entity))
        self.db.insert(ptr)
        # return the description_id
        return description_id
            
    def update_entity_by_instance_id(self, description_id, entity):
        '''
        Update the entity in the world object description database with the given description_id, if
        one exists.
        
        @param description_id: the description_id of the entity to update
        @type  description_id: string
        @param entity: the entity to update with
        @type  entity: dict
        @return: if an entity was found and updated with the given description_id
        @rtype:  bool
        '''
        # check if that id exists and update it
        return self.db.find_and_modify({'description_id' : description_id}, {'$set' : entity}) is not None

    def search__id(self, _id):
        '''
        Search for and return the entity in the world object description database with the given ID, 
        if one exists. Note that this ID is associated with the internal, database ID, not the 
        description_id. See search_description_id instead for this search.
        
        @param _id: the ID of the entity to search for
        @type  _id: string
        @return: the entity found, or None if an invalid ID was given
        @rtype:  dict
        '''
        return self.db.find_one({'_id' : _id})
    
    def search_description_id(self, description_id):
        '''
        Search for and return the entity in the world object description database with the given 
        description_id, if one exists. This will load the file and return the contents.
        
        @param description_id: the description_id field of the entity to search for
        @type  description_id: string
        @return: the entity found, or None if an invalid description_id was given
        @rtype:  dict
        '''
        ptr = self.db.find_one({'description_id' : description_id})
        if ptr is not None:
            desc_file = self.fs.get(ptr['file_id'])
            if desc_file is not None:
                return pickle.loads(desc_file.read())
        # no file found
        return None
    
    def get_world_object_descriptions(self):
        '''
        Return an array of all the world object descriptions in the database.

        @return: the list of entities
        @rtype:  pymongo.cursor.Cursor
        '''
        return self.db.find()
