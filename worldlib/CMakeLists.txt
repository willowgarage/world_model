cmake_minimum_required(VERSION 2.8.3)
project(worldlib)

## Find catkin macros and libraries
## if COMPONENTS list like find_package(catkin REQUIRED COMPONENTS xyz)
## is used, also find other catkin packages
find_package(catkin REQUIRED COMPONENTS rospy std_msgs geometry_msgs message_generation rosbridge_library)

## Uncomment this if the package has a setup.py. This macro ensures
## modules and scripts declared therein get installed
catkin_python_setup()

###################################################
## Declare things to be passed to other projects ##
###################################################

#######################################
## Declare ROS messages and services ##
#######################################

## Generate messages in the 'msg' folder
add_message_files(
  FILES
  WorldModelPose.msg
  WorldModelConfig.msg
  WorldModelObservation.msg
  WorldModelEntity.msg
)

## Generate services in the 'srv' folder
add_service_files(
  FILES
  UpdateWorldModel.srv
)

## Generate added messages and services with any dependencies listed here
generate_messages(
  DEPENDENCIES
  std_msgs
  geometry_msgs
)

## LIBRARIES: libraries you create in this project that dependent projects also need
## CATKIN_DEPENDS: catkin_packages dependent projects also need
## DEPENDS: system dependencies of this project that dependent projects also need
catkin_package()

#############
## Install ##
#############

install(PROGRAMS scripts/world_model
  DESTINATION ${CATKIN_PACKAGE_BIN_DESTINATION}
)
