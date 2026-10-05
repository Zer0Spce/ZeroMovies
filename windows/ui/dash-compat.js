'use strict';
// Some ZTE IPTV manifests put video resolution in the audio-channel count.
// Ignore invalid counts; AAC initialization defines the real audio layout.
window.zeroDashCompat = data => {
  const text=new TextDecoder().decode(data);
  if(!/<(?:\w+:)?MPD(?:\s|>)/.test(text))return data;
  const xml=new DOMParser().parseFromString(text,'application/xml');
  if(xml.getElementsByTagName('parsererror').length)return data;
  let changed=false;
  for(const node of Array.from(xml.getElementsByTagNameNS('*','AudioChannelConfiguration'))){
    if(node.getAttribute('schemeIdUri')!=='urn:mpeg:dash:23003:3:audio_channel_configuration:2011')continue;
    const value=node.getAttribute('value')||'';
    if(!/^\d+$/.test(value)||Number(value)<1||Number(value)>32){node.remove();changed=true;}
  }
  return changed?new TextEncoder().encode(new XMLSerializer().serializeToString(xml)):data;
};
