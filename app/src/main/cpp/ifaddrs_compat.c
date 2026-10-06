/* IPv4/IPv6 interface enumeration for Android 6, whose libc predates getifaddrs.
 * Loaded only on API 23; API 24+ uses the platform implementation. */
#include <sys/socket.h>
#include <sys/ioctl.h>
#include <net/if.h>
#include <netinet/in.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <errno.h>
#include <stdio.h>
#include <ifaddrs.h>
void freeifaddrs(struct ifaddrs *head) {
    while (head) {
        struct ifaddrs *next = head->ifa_next;
        free(head->ifa_name); free(head->ifa_addr);
        free(head->ifa_netmask); free(head->ifa_broadaddr);
        free(head); head = next;
    }
}
int getifaddrs(struct ifaddrs **result) {
    if (!result) { errno = EINVAL; return -1; }
    *result = NULL;
    int fd = socket(AF_INET, SOCK_DGRAM, 0);
    if (fd < 0) return -1;
    size_t size = 4096;
    char *buffer = NULL;
    struct ifconf conf;
    for (;;) {
        char *next = realloc(buffer, size);
        if (!next) { free(buffer); close(fd); errno = ENOMEM; return -1; }
        buffer = next;
        conf.ifc_len = (int)size; conf.ifc_buf = buffer;
        if (ioctl(fd, SIOCGIFCONF, &conf) < 0) { int saved = errno; free(buffer); close(fd); errno = saved; return -1; }
        if ((size_t)conf.ifc_len + sizeof(struct ifreq) < size || size >= 65536) break;
        size *= 2;
    }
    struct ifaddrs **tail = result;
    for (int offset = 0; offset + (int)sizeof(struct ifreq) <= conf.ifc_len; offset += sizeof(struct ifreq)) {
        struct ifreq *entry = (struct ifreq *)(buffer + offset), query;
        if (entry->ifr_addr.sa_family != AF_INET) continue;
        struct ifaddrs *node = calloc(1, sizeof(*node));
        if (!node) goto fail;
        node->ifa_name = strndup(entry->ifr_name, IFNAMSIZ);
        node->ifa_addr = malloc(sizeof(struct sockaddr_in));
        node->ifa_netmask = calloc(1, sizeof(struct sockaddr_in));
        node->ifa_broadaddr = calloc(1, sizeof(struct sockaddr_in));
        if (!node->ifa_name || !node->ifa_addr || !node->ifa_netmask || !node->ifa_broadaddr) { freeifaddrs(node); goto fail; }
        memcpy(node->ifa_addr, &entry->ifr_addr, sizeof(struct sockaddr_in));
        memset(&query, 0, sizeof(query)); memcpy(query.ifr_name, entry->ifr_name, IFNAMSIZ);
        if (ioctl(fd, SIOCGIFFLAGS, &query) == 0) node->ifa_flags = (unsigned short)query.ifr_flags;
        memset(&query, 0, sizeof(query)); memcpy(query.ifr_name, entry->ifr_name, IFNAMSIZ);
        if (ioctl(fd, SIOCGIFNETMASK, &query) == 0) memcpy(node->ifa_netmask, &query.ifr_netmask, sizeof(struct sockaddr_in));
        memset(&query, 0, sizeof(query)); memcpy(query.ifr_name, entry->ifr_name, IFNAMSIZ);
        if (ioctl(fd, SIOCGIFBRDADDR, &query) == 0) memcpy(node->ifa_broadaddr, &query.ifr_broadaddr, sizeof(struct sockaddr_in));
        *tail = node; tail = &node->ifa_next;
    }
    /* Android 6 exposes IPv6 interface addresses through this kernel table. */
    FILE *ipv6 = fopen("/proc/net/if_inet6", "r");
    if (ipv6) {
        char hex[33], name[IFNAMSIZ]; unsigned index, prefix, scope, flags;
        while (fscanf(ipv6, "%32s %x %x %x %x %15s", hex, &index, &prefix, &scope, &flags, name) == 6) {
            if (strlen(hex) != 32 || prefix > 128) continue;
            struct ifaddrs *node = calloc(1, sizeof(*node));
            if (!node) { fclose(ipv6); goto fail; }
            node->ifa_name = strdup(name);
            node->ifa_addr = calloc(1, sizeof(struct sockaddr_in6));
            node->ifa_netmask = calloc(1, sizeof(struct sockaddr_in6));
            if (!node->ifa_name || !node->ifa_addr || !node->ifa_netmask) { freeifaddrs(node); fclose(ipv6); goto fail; }
            struct sockaddr_in6 *address = (struct sockaddr_in6 *)node->ifa_addr;
            struct sockaddr_in6 *mask = (struct sockaddr_in6 *)node->ifa_netmask;
            address->sin6_family = mask->sin6_family = AF_INET6;
            for (int i = 0; i < 16; i++) { unsigned byte = 0; sscanf(hex + i * 2, "%2x", &byte); address->sin6_addr.s6_addr[i] = (unsigned char)byte; int bits = (int)prefix - i * 8; mask->sin6_addr.s6_addr[i] = bits >= 8 ? 255 : bits <= 0 ? 0 : (unsigned char)(255 << (8 - bits)); }
            if (scope == 0x20) address->sin6_scope_id = index;
            struct ifreq query; memset(&query, 0, sizeof(query)); strncpy(query.ifr_name, name, IFNAMSIZ - 1);
            if (ioctl(fd, SIOCGIFFLAGS, &query) == 0) node->ifa_flags = (unsigned short)query.ifr_flags;
            *tail = node; tail = &node->ifa_next;
        }
        fclose(ipv6);
    }
    free(buffer); close(fd); return 0;
fail:
    free(buffer); close(fd); freeifaddrs(*result); *result = NULL; errno = ENOMEM; return -1;
}
