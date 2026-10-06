cmake_minimum_required(VERSION 3.22.1)
project(zeroplay_android6_compat C)
add_library(zeroplay_ifaddrs_compat SHARED ifaddrs_compat.c)
# Android 6 must expose these symbols to libraries subsequently loaded by JNI.
target_link_options(zeroplay_ifaddrs_compat PRIVATE "-Wl,-z,global")
