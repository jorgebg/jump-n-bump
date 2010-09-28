var frame = 0;
var next_time = 0;

var jetpack = 0;
var pogostick = 0;
var bunnies_in_space = 0;
var flies_enabled = 0;

var JNB_MAX_PLAYERS = 4;

var NUM_POBS = 200;
var NUM_FLIES = 20;
var NUM_LEFTOVERS = 50;

function rnd(max_value) {
    return Math.floor(Math.random()*max_value);
}

var main_info = {
	draw_page : null,
	page_info : {
		num_pobs : 0,
		pobs : []
	},
};

var player = [];
function create_player(keys) {
    return {
        action_left : false,
        action_up : false,
        action_right : false,
        enabled : false,
        dead_flag : false,
        bumps : false,
        bumped : [],
        x : 0, y : 0,
        x_add : 0, y_add : 0,
        direction : 0,
        jump_ready : false,
        jump_abort : false,
        in_water : false,
        anim : 0,
        frame : 0,
        frame_tick : 0,
        image : 0,
        keys : keys
    };
}

function timeGetTime() {
    return new Date().getTime();
}

var keys_pressed = {}
function onKeyDown(evt) {
    keys_pressed[evt.keyCode] = true;
}

function onKeyUp(evt) {
    keys_pressed[evt.keyCode] = false;
}

function key_pressed(key) {
    return keys_pressed[key];
}

function update_player_actions() {
    for (var i=0;i!=player.length;++i) {
        player[i].action_left = key_pressed(player[i].keys[0]);
        player[i].action_right = key_pressed(player[i].keys[1]);
        player[i].action_up = key_pressed(player[i].keys[2]);
    }
}

function player_action_left(p) {
	var s1 = 0, s2 = 0;
	var below_left, below, below_right;

    s1 = (p.x >> 16);
    s2 = (p.y >> 16);
	below_left = GET_BAN_MAP_XY(s1, s2 + 16);
	below = GET_BAN_MAP_XY(s1 + 8, s2 + 16);
	below_right = GET_BAN_MAP_XY(s1 + 15, s2 + 16);

    if (below == BAN_ICE) {
        if (p.x_add > 0) {
            p.x_add -= 1024;
        } else {
            p.x_add -= 768;
        }
    } else if ((below_left != BAN_SOLID && below_right == BAN_ICE) || (below_left == BAN_ICE && below_right != BAN_SOLID)) {
        if (p.x_add > 0) {
            p.x_add -= 1024;
        } else {
            p.x_add -= 768;
        }
    } else {
        if (p.x_add > 0) {
            p.x_add -= 16384;
            if (p.x_add > -98304 && p.in_water == 0 && below == BAN_SOLID) {
                add_object(OBJ_SMOKE, (p.x >> 16) + 2 + rnd(9), (p.y >> 16) + 13 + rnd(5), 0, -16384 - rnd(8192), OBJ_ANIM_SMOKE, 0);
            }
        } else {
            p.x_add -= 12288;
        }
    }
    if (p.x_add < -98304) {
        p.x_add = -98304;
    }
    p.direction = 1;
    if (p.anim == 0) {
        p.anim = 1;
        p.frame = 0;
        p.frame_tick = 0;
        p.image = player_anims[p.anim].frame[p.frame].image + p.direction * 9;
    }
}

function player_action_right(p) {
	var s1 = 0, s2 = 0;
	var below_left, below, below_right;

    s1 = (p.x >> 16);
    s2 = (p.y >> 16);
	below_left = GET_BAN_MAP_XY(s1, s2 + 16);
	below = GET_BAN_MAP_XY(s1 + 8, s2 + 16);
	below_right = GET_BAN_MAP_XY(s1 + 15, s2 + 16);

    if (below == BAN_ICE) {
        if (p.x_add < 0) {
            p.x_add += 1024;
        } else {
            p.x_add += 768;
        }
    } else if ((below_left != BAN_SOLID && below_right == BAN_ICE) || (below_left == BAN_ICE && below_right != BAN_SOLID)) {
        if (p.x_add > 0) {
            p.x_add += 1024;
        } else {
            p.x_add += 768;
        }
    } else {
        if (p.x_add < 0) {
            p.x_add += 16384;
            if (p.x_add < 98304 && p.in_water == 0 && below == BAN_SOLID) {
                add_object(OBJ_SMOKE, (p.x >> 16) + 2 + rnd(9), (p.y >> 16) + 13 + rnd(5), 0, -16384 - rnd(8192), OBJ_ANIM_SMOKE, 0);
            }
        } else {
            p.x_add += 12288;
        }
    }
    if (p.x_add > 98304) {
        p.x_add = 98304;
    }
    p.direction = 0;
    if (p.anim == 0) {
        p.anim = 1;
        p.frame = 0;
        p.frame_tick = 0;
        p.image = player_anims[p.anim].frame[p.frame].image + p.direction * 9;
    }
}

function steer_players() {  
    update_player_actions();
    for (var i=0;i!=player.length;++i) {
        var p = player[i];
        if (p.enabled) {
            if (!p.dead_flag) {
				if (p.action_left && p.action_right) {
					if (p.direction == 0) {
						if (p.action_right) {
							player_action_right(p);
						}
					} else {
						if (p.action_left) {
							player_action_left(p);
						}
					}
				} else if (p.action_left) {
					player_action_left(p);
				} else if (p.action_right) {
					player_action_right(p);
				} else if ((!p.action_left) && (!p.action_right)) {
					var below_left, below, below_right;

					s1 = (p.x >> 16);
					s2 = (p.y >> 16);
					below_left = GET_BAN_MAP_XY(s1, s2 + 16);
					below = GET_BAN_MAP_XY(s1 + 8, s2 + 16);
					below_right = GET_BAN_MAP_XY(s1 + 15, s2 + 16);
					if (below == BAN_SOLID || below == BAN_SPRING || (((below_left == BAN_SOLID || below_left == BAN_SPRING) && below_right != BAN_ICE) || (below_left != BAN_ICE && (below_right == BAN_SOLID || below_right == BAN_SPRING)))) {
						if (p.x_add < 0) {
							p.x_add += 16384;
							if (p.x_add > 0)
								p.x_add = 0;
						} else {
							p.x_add -= 16384;
							if (p.x_add < 0)
								p.x_add = 0;
						}
						if (p.x_add != 0 && GET_BAN_MAP_XY((s1 + 8), (s2 + 16)) == BAN_SOLID)
							add_object(OBJ_SMOKE, (p.x >> 16) + 2 + rnd(9), (p.y >> 16) + 13 + rnd(5), 0, -16384 - rnd(8192), OBJ_ANIM_SMOKE, 0);
					}
					if (p.anim == 1) {
						p.anim = 0;
						p.frame = 0;
						p.frame_tick = 0;
						p.image = player_anims[p.anim].frame[p.frame].image + p.direction * 9;
					}
                }
				if (jetpack == 0) {
					/* no jetpack */
					if (pogostick == 1 || (p.jump_ready == 1 && p.action_up)) {
						s1 = (p.x >> 16);
						s2 = (p.y >> 16);
						if (s2 < -16)
							s2 = -16;
						/* jump */
						if (GET_BAN_MAP_XY(s1, (s2 + 16)) == BAN_SOLID || GET_BAN_MAP_XY(s1, (s2 + 16)) == BAN_ICE || GET_BAN_MAP_XY((s1 + 15), (s2 + 16)) == BAN_SOLID || GET_BAN_MAP_XY((s1 + 15), (s2 + 16)) == BAN_ICE) {
							p.y_add = -280000;
							p.anim = 2;
							p.frame = 0;
							p.frame_tick = 0;
							p.image = player_anims[p.anim].frame[p.frame].image + p.direction * 9;
							p.jump_ready = 0;
							p.jump_abort = 1;
/*
							if (pogostick == 0)
								dj_play_sfx(SFX_JUMP, (unsigned short)(SFX_JUMP_FREQ + rnd(2000) - 1000), 64, 0, 0, -1);
							else
								dj_play_sfx(SFX_SPRING, (unsigned short)(SFX_SPRING_FREQ + rnd(2000) - 1000), 64, 0, 0, -1);
*/
						}
						/* jump out of water */
						if (GET_BAN_MAP_IN_WATER(s1, s2)) {
							p.y_add = -196608;
							p.in_water = 0;
							p.anim = 2;
							p.frame = 0;
							p.frame_tick = 0;
							p.image = player_anims[p.anim].frame[p.frame].image + p.direction * 9;
							p.jump_ready = 0;
							p.jump_abort = 1;
/*
							if (pogostick == 0)
								dj_play_sfx(SFX_JUMP, (unsigned short)(SFX_JUMP_FREQ + rnd(2000) - 1000), 64, 0, 0, -1);
							else
								dj_play_sfx(SFX_SPRING, (unsigned short)(SFX_SPRING_FREQ + rnd(2000) - 1000), 64, 0, 0, -1);
*/
						}
					}
					/* fall down by gravity */
					if (pogostick == 0 && (!p.action_up)) {
						p.jump_ready = 1;
						if (p.in_water == 0 && p.y_add < 0 && p.jump_abort == 1) {
							if (bunnies_in_space == 0)
								/* normal gravity */
								p.y_add += 32768;
							else
								/* light gravity */
								p.y_add += 16384;
							if (p.y_add > 0)
								p.y_add = 0;
						}
					}
				} else {
					/* with jetpack */
					if (p.action_up) {
						p.y_add -= 16384;
						if (p.y_add < -400000)
							p.y_add = -400000;
						if (GET_BAN_MAP_IN_WATER(s1, s2))
							p.in_water = 0;
						if (rnd(100) < 50)
							add_object(OBJ_SMOKE, (p.x >> 16) + 6 + rnd(5), (p.y >> 16) + 10 + rnd(5), 0, 16384 + rnd(8192), OBJ_ANIM_SMOKE, 0);
					}
				}

				p.x += p.x_add;
				if ((p.x >> 16) < 0) {
					p.x = 0;
					p.x_add = 0;
				}
				if ((p.x >> 16) + 15 > 351) {
					p.x = 336 << 16;
					p.x_add = 0;
				}
				{
					if (p.y > 0) {
						s2 = (p.y >> 16);
					} else {
						/* check top line only */
						s2 = 0;
					}

					s1 = (p.x >> 16);
					if (GET_BAN_MAP_XY(s1, s2) == BAN_SOLID || GET_BAN_MAP_XY(s1, s2) == BAN_ICE || GET_BAN_MAP_XY(s1, s2) == BAN_SPRING || GET_BAN_MAP_XY(s1, (s2 + 15)) == BAN_SOLID || GET_BAN_MAP_XY(s1, (s2 + 15)) == BAN_ICE || GET_BAN_MAP_XY(s1, (s2 + 15)) == BAN_SPRING) {
						p.x = (((s1 + 16) & 0xfff0)) << 16;
						p.x_add = 0;
					}

					s1 = (p.x >> 16);
					if (GET_BAN_MAP_XY((s1 + 15), s2) == BAN_SOLID || GET_BAN_MAP_XY((s1 + 15), s2) == BAN_ICE || GET_BAN_MAP_XY((s1 + 15), s2) == BAN_SPRING || GET_BAN_MAP_XY((s1 + 15), (s2 + 15)) == BAN_SOLID || GET_BAN_MAP_XY((s1 + 15), (s2 + 15)) == BAN_ICE || GET_BAN_MAP_XY((s1 + 15), (s2 + 15)) == BAN_SPRING) {
						p.x = (((s1 + 16) & 0xfff0) - 16) << 16;
						p.x_add = 0;
					}
				}

				p.y += p.y_add;

				s1 = (p.x >> 16);
				s2 = (p.y >> 16);
				if (GET_BAN_MAP_XY((s1 + 8), (s2 + 15)) == BAN_SPRING || ((GET_BAN_MAP_XY(s1, (s2 + 15)) == BAN_SPRING && GET_BAN_MAP_XY((s1 + 15), (s2 + 15)) != BAN_SOLID) || (GET_BAN_MAP_XY(s1, (s2 + 15)) != BAN_SOLID && GET_BAN_MAP_XY((s1 + 15), (s2 + 15)) == BAN_SPRING))) {
					p.y = ((p.y >> 16) & 0xfff0) << 16;
					p.y_add = -400000;
					p.anim = 2;
					p.frame = 0;
					p.frame_tick = 0;
					p.image = player_anims[p.anim].frame[p.frame].image + p.direction * 9;
					p.jump_ready = 0;
					p.jump_abort = 0;
					for (c2 = 0; c2 < NUM_OBJECTS; c2++) {
						if (objects[c2].used == 1 && objects[c2].type == OBJ_SPRING) {
							if (GET_BAN_MAP_XY((s1 + 8), (s2 + 15)) == BAN_SPRING) {
								if ((objects[c2].x >> 20) == ((s1 + 8) >> 4) && (objects[c2].y >> 20) == ((s2 + 15) >> 4)) {
									objects[c2].frame = 0;
									objects[c2].ticks = object_anims[objects[c2].anim].frame[objects[c2].frame].ticks;
									objects[c2].image = object_anims[objects[c2].anim].frame[objects[c2].frame].image;
									break;
								}
							} else {
								if (GET_BAN_MAP_XY(s1, (s2 + 15)) == BAN_SPRING) {
									if ((objects[c2].x >> 20) == (s1 >> 4) && (objects[c2].y >> 20) == ((s2 + 15) >> 4)) {
										objects[c2].frame = 0;
										objects[c2].ticks = object_anims[objects[c2].anim].frame[objects[c2].frame].ticks;
										objects[c2].image = object_anims[objects[c2].anim].frame[objects[c2].frame].image;
										break;
									}
								} else if (GET_BAN_MAP_XY((s1 + 15), (s2 + 15)) == BAN_SPRING) {
									if ((objects[c2].x >> 20) == ((s1 + 15) >> 4) && (objects[c2].y >> 20) == ((s2 + 15) >> 4)) {
										objects[c2].frame = 0;
										objects[c2].ticks = object_anims[objects[c2].anim].frame[objects[c2].frame].ticks;
										objects[c2].image = object_anims[objects[c2].anim].frame[objects[c2].frame].image;
										break;
									}
								}
							}
						}
					}
					// dj_play_sfx(SFX_SPRING, (unsigned short)(SFX_SPRING_FREQ + rnd(2000) - 1000), 64, 0, 0, -1);
				}
				s1 = (p.x >> 16);
				s2 = (p.y >> 16);
				if (s2 < 0)
					s2 = 0;
				if (GET_BAN_MAP_XY(s1, s2) == BAN_SOLID || GET_BAN_MAP_XY(s1, s2) == BAN_ICE || GET_BAN_MAP_XY(s1, s2) == BAN_SPRING || GET_BAN_MAP_XY((s1 + 15), s2) == BAN_SOLID || GET_BAN_MAP_XY((s1 + 15), s2) == BAN_ICE || GET_BAN_MAP_XY((s1 + 15), s2) == BAN_SPRING) {
					p.y = (((s2 + 16) & 0xfff0)) << 16;
					p.y_add = 0;
					p.anim = 0;
					p.frame = 0;
					p.frame_tick = 0;
					p.image = player_anims[p.anim].frame[p.frame].image + p.direction * 9;
				}
				s1 = (p.x >> 16);
				s2 = (p.y >> 16);
				if (s2 < 0)
					s2 = 0;
				if (GET_BAN_MAP_XY((s1 + 8), (s2 + 8)) == BAN_WATER) {
					if (p.in_water == 0) {
						/* falling into water */
						p.in_water = 1;
						p.anim = 4;
						p.frame = 0;
						p.frame_tick = 0;
						p.image = player_anims[p.anim].frame[p.frame].image + p.direction * 9;
						if (p.y_add >= 32768) {
							add_object(OBJ_SPLASH, (p.x >> 16) + 8, ((p.y >> 16) & 0xfff0) + 15, 0, 0, OBJ_ANIM_SPLASH, 0);
                            /*
							if (blood_is_thicker_than_water == 0)
								dj_play_sfx(SFX_SPLASH, (unsigned short)(SFX_SPLASH_FREQ + rnd(2000) - 1000), 64, 0, 0, -1);
							else
								dj_play_sfx(SFX_SPLASH, (unsigned short)(SFX_SPLASH_FREQ + rnd(2000) - 5000), 64, 0, 0, -1);
                            */
						}
					}
					/* slowly move up to water surface */
					p.y_add -= 1536;
					if (p.y_add < 0 && p.anim != 5) {
						p.anim = 5;
						p.frame = 0;
						p.frame_tick = 0;
						p.image = player_anims[p.anim].frame[p.frame].image + p.direction * 9;
					}
					if (p.y_add < -65536)
						p.y_add = -65536;
					if (p.y_add > 65535)
						p.y_add = 65535;
					if (GET_BAN_MAP_XY(s1, (s2 + 15)) == BAN_SOLID || GET_BAN_MAP_XY(s1, (s2 + 15)) == BAN_ICE || GET_BAN_MAP_XY((s1 + 15), (s2 + 15)) == BAN_SOLID || GET_BAN_MAP_XY((s1 + 15), (s2 + 15)) == BAN_ICE) {
						p.y = (((s2 + 16) & 0xfff0) - 16) << 16;
						p.y_add = 0;
					}
				} else if (GET_BAN_MAP_XY(s1, (s2 + 15)) == BAN_SOLID || GET_BAN_MAP_XY(s1, (s2 + 15)) == BAN_ICE || GET_BAN_MAP_XY(s1, (s2 + 15)) == BAN_SPRING || GET_BAN_MAP_XY((s1 + 15), (s2 + 15)) == BAN_SOLID || GET_BAN_MAP_XY((s1 + 15), (s2 + 15)) == BAN_ICE || GET_BAN_MAP_XY((s1 + 15), (s2 + 15)) == BAN_SPRING) {
					p.in_water = 0;
					p.y = (((s2 + 16) & 0xfff0) - 16) << 16;
					p.y_add = 0;
					if (p.anim != 0 && p.anim != 1) {
						p.anim = 0;
						p.frame = 0;
						p.frame_tick = 0;
						p.image = player_anims[p.anim].frame[p.frame].image + p.direction * 9;
					}
				} else {
					if (p.in_water == 0) {
						if (bunnies_in_space == 0)
							p.y_add += 12288;
						else
							p.y_add += 6144;
						if (p.y_add > 327680)
							p.y_add = 327680;
					} else {
						p.y = (p.y & 0xffff0000) + 0x10000;
						p.y_add = 0;
					}
					p.in_water = 0;
				}
				if (p.y_add > 36864 && p.anim != 3 && p.in_water == 0) {
					p.anim = 3;
					p.frame = 0;
					p.frame_tick = 0;
					p.image = player_anims[p.anim].frame[p.frame].image + p.direction * 9;
				}

			}

			p.frame_tick++;
			if (p.frame_tick >= player_anims[p.anim].frame[p.frame].ticks) {
				p.frame++;
				if (p.frame >= player_anims[p.anim].num_frames) {
					if (p.anim != 6)
						p.frame = player_anims[p.anim].restart_frame;
					else
						position_player(c1);
				}
				p.frame_tick = 0;
			}
			p.image = player_anims[p.anim].frame[p.frame].image + p.direction * 9;

		}

	}
}

function collision_check() {
	var c1 = 0, c2 = 0, c3 = 0;
	var l1;

	/* collision check */
	for (c3 = 0; c3 < 6; c3++) {
		if (c3 == 0) {
			c1 = 0;
			c2 = 1;
		} else if (c3 == 1) {
			c1 = 0;
			c2 = 2;
		} else if (c3 == 2) {
			c1 = 0;
			c2 = 3;
		} else if (c3 == 3) {
			c1 = 1;
			c2 = 2;
		} else if (c3 == 4) {
			c1 = 1;
			c2 = 3;
		} else if (c3 == 5) {
			c1 = 2;
			c2 = 3;
		}
		if (player[c1].enabled == 1 && player[c2].enabled == 1) {
			if (labs(player[c1].x - player[c2].x) < 0xC0000 && labs(player[c1].y - player[c2].y) < 0xC0000) {
				if ((labs(player[c1].y - player[c2].y) >> 16) > 5) {
					if (player[c1].y < player[c2].y) {
						player_kill(c1,c2);
					} else {
						player_kill(c2,c1);
					}
				} else {
					if (player[c1].x < player[c2].x) {
						if (player[c1].x_add > 0)
							player[c1].x = player[c2].x - 0xC0000;
						else if (player[c2].x_add < 0)
							player[c2].x = player[c1].x + 0xC0000;
						else {
							player[c1].x -= player[c1].x_add;
							player[c2].x -= player[c2].x_add;
						}
						l1 = player[c2].x_add;
						player[c2].x_add = player[c1].x_add;
						player[c1].x_add = l1;
						if (player[c1].x_add > 0)
							player[c1].x_add = -player[c1].x_add;
						if (player[c2].x_add < 0)
							player[c2].x_add = -player[c2].x_add;
					} else {
						if (player[c1].x_add > 0)
							player[c2].x = player[c1].x - 0xC0000;
						else if (player[c2].x_add < 0)
							player[c1].x = player[c2].x + 0xC0000;
						else {
							player[c1].x -= player[c1].x_add;
							player[c2].x -= player[c2].x_add;
						}
						l1 = player[c2].x_add;
						player[c2].x_add = player[c1].x_add;
						player[c1].x_add = l1;
						if (player[c1].x_add < 0)
							player[c1].x_add = -player[c1].x_add;
						if (player[c2].x_add > 0)
							player[c2].x_add = -player[c2].x_add;
					}
				}
			}
		}
	}
}

function put_pob(ctx, x, y, image) {
    var img = document.getElementById('objects');
    ctx.drawImage(img, 0, 14, 29, 10, x, y, 29, 10);
//    ctx.fillStyle = "rgba(" + image*16 + ",0,0,0.5)";
//    ctx.fillRect(x, y, 16, 16);
}

function draw_pobs(ctx) {
	var c1;
	var back_buf_ofs = 0;
    var page_info = main_info.page_info;

    ctx.fillStyle = "rgba(" + (frame%256) + ",0,0,0.5)";
    ctx.fillRect(player[0].x >> 16, player[0].y >> 16, 16, 16);

	for (c1 = page_info.num_pobs - 1; c1 >= 0; c1--) {
        var pob = page_info.pobs[c1];
        put_pob(ctx, pob.x, pob.y, pob.image);
	}
}

function update_objects() {
	var c1;
	var s1 = 0;

	for (c1 = 0; c1 < NUM_OBJECTS; c1++) {
        var obj = objects[c1];
		if (obj.used) {
			switch (obj.type) {
			case OBJ_SPRING:
				obj.ticks--;
				if (obj.ticks <= 0) {
					obj.frame++;
					if (obj.frame >= object_anims[obj.anim].num_frames) {
						obj.frame--;
						obj.ticks = object_anims[obj.anim].frame[obj.frame].ticks;
					} else {
						obj.ticks = object_anims[obj.anim].frame[obj.frame].ticks;
						obj.image = object_anims[obj.anim].frame[obj.frame].image;
					}
				}
				if (obj.used)
					add_pob(obj.x >> 16, obj.y >> 16, obj.image);
				break;
			case OBJ_SPLASH:
				obj.ticks--;
				if (obj.ticks <= 0) {
					obj.frame++;
					if (obj.frame >= object_anims[obj.anim].num_frames)
						obj.used = false;
					else {
						obj.ticks = object_anims[obj.anim].frame[obj.frame].ticks;
						obj.image = object_anims[obj.anim].frame[obj.frame].image;
					}
				}
				if (obj.used)
					add_pob(obj.x >> 16, obj.y >> 16, obj.image);
				break;
			case OBJ_SMOKE:
				obj.x += obj.x_add;
				obj.y += obj.y_add;
				obj.ticks--;
				if (obj.ticks <= 0) {
					obj.frame++;
					if (obj.frame >= object_anims[obj.anim].num_frames)
						obj.used = false;
					else {
						obj.ticks = object_anims[obj.anim].frame[obj.frame].ticks;
						obj.image = object_anims[obj.anim].frame[obj.frame].image;
					}
				}
				if (obj.used)
					add_pob(obj.x >> 16, obj.y >> 16, obj.image);
				break;
			case OBJ_YEL_BUTFLY:
			case OBJ_PINK_BUTFLY:
				obj.x_acc += rnd(128) - 64;
				if (obj.x_acc < -1024)
					obj.x_acc = -1024;
				if (obj.x_acc > 1024)
					obj.x_acc = 1024;
				obj.x_add += obj.x_acc;
				if (obj.x_add < -32768)
					obj.x_add = -32768;
				if (obj.x_add > 32768)
					obj.x_add = 32768;
				obj.x += obj.x_add;
				if ((obj.x >> 16) < 16) {
					obj.x = 16 << 16;
					obj.x_add = -obj.x_add >> 2;
					obj.x_acc = 0;
				} else if ((obj.x >> 16) > 350) {
					obj.x = 350 << 16;
					obj.x_add = -obj.x_add >> 2;
					obj.x_acc = 0;
				}
				if (ban_map[obj.y >> 20][obj.x >> 20] != 0) {
					if (obj.x_add < 0) {
						obj.x = (((obj.x >> 16) + 16) & 0xfff0) << 16;
					} else {
						obj.x = ((((obj.x >> 16) - 16) & 0xfff0) + 15) << 16;
					}
					obj.x_add = -obj.x_add >> 2;
					obj.x_acc = 0;
				}
				obj.y_acc += rnd(64) - 32;
				if (obj.y_acc < -1024)
					obj.y_acc = -1024;
				if (obj.y_acc > 1024)
					obj.y_acc = 1024;
				obj.y_add += obj.y_acc;
				if (obj.y_add < -32768)
					obj.y_add = -32768;
				if (obj.y_add > 32768)
					obj.y_add = 32768;
				obj.y += obj.y_add;
				if ((obj.y >> 16) < 0) {
					obj.y = 0;
					obj.y_add = -obj.y_add >> 2;
					obj.y_acc = 0;
				} else if ((obj.y >> 16) > 255) {
					obj.y = 255 << 16;
					obj.y_add = -obj.y_add >> 2;
					obj.y_acc = 0;
				}
				if (ban_map[obj.y >> 20][obj.x >> 20] != 0) {
					if (obj.y_add < 0) {
						obj.y = (((obj.y >> 16) + 16) & 0xfff0) << 16;
					} else {
						obj.y = ((((obj.y >> 16) - 16) & 0xfff0) + 15) << 16;
					}
					obj.y_add = -obj.y_add >> 2;
					obj.y_acc = 0;
				}
				if (obj.type == OBJ_YEL_BUTFLY) {
					if (obj.x_add < 0 && obj.anim != OBJ_ANIM_YEL_BUTFLY_LEFT) {
						obj.anim = OBJ_ANIM_YEL_BUTFLY_LEFT;
						obj.frame = 0;
						obj.ticks = object_anims[obj.anim].frame[obj.frame].ticks;
						obj.image = object_anims[obj.anim].frame[obj.frame].image;
					} else if (obj.x_add > 0 && obj.anim != OBJ_ANIM_YEL_BUTFLY_RIGHT) {
						obj.anim = OBJ_ANIM_YEL_BUTFLY_RIGHT;
						obj.frame = 0;
						obj.ticks = object_anims[obj.anim].frame[obj.frame].ticks;
						obj.image = object_anims[obj.anim].frame[obj.frame].image;
					}
				} else {
					if (obj.x_add < 0 && obj.anim != OBJ_ANIM_PINK_BUTFLY_LEFT) {
						obj.anim = OBJ_ANIM_PINK_BUTFLY_LEFT;
						obj.frame = 0;
						obj.ticks = object_anims[obj.anim].frame[obj.frame].ticks;
						obj.image = object_anims[obj.anim].frame[obj.frame].image;
					} else if (obj.x_add > 0 && obj.anim != OBJ_ANIM_PINK_BUTFLY_RIGHT) {
						obj.anim = OBJ_ANIM_PINK_BUTFLY_RIGHT;
						obj.frame = 0;
						obj.ticks = object_anims[obj.anim].frame[obj.frame].ticks;
						obj.image = object_anims[obj.anim].frame[obj.frame].image;
					}
				}
				obj.ticks--;
				if (obj.ticks <= 0) {
					obj.frame++;
					if (obj.frame >= object_anims[obj.anim].num_frames)
						obj.frame = object_anims[obj.anim].restart_frame;
					else {
						obj.ticks = object_anims[obj.anim].frame[obj.frame].ticks;
						obj.image = object_anims[obj.anim].frame[obj.frame].image;
					}
				}
				if (obj.used)
					add_pob(obj.x >> 16, obj.y >> 16, obj.image);
				break;
			case OBJ_FUR:
				if (rnd(100) < 30)
					add_object(OBJ_FLESH_TRACE, obj.x >> 16, obj.y >> 16, 0, 0, OBJ_ANIM_FLESH_TRACE, 0);
				if (ban_map[obj.y >> 20][obj.x >> 20] == 0) {
					obj.y_add += 3072;
					if (obj.y_add > 196608)
						obj.y_add = 196608;
				} else if (ban_map[obj.y >> 20][obj.x >> 20] == 2) {
					if (obj.x_add < 0) {
						if (obj.x_add < -65536)
							obj.x_add = -65536;
						obj.x_add += 1024;
						if (obj.x_add > 0)
							obj.x_add = 0;
					} else {
						if (obj.x_add > 65536)
							obj.x_add = 65536;
						obj.x_add -= 1024;
						if (obj.x_add < 0)
							obj.x_add = 0;
					}
					obj.y_add += 1024;
					if (obj.y_add < -65536)
						obj.y_add = -65536;
					if (obj.y_add > 65536)
						obj.y_add = 65536;
				}
				obj.x += obj.x_add;
				if ((obj.y >> 16) > 0 && (ban_map[obj.y >> 20][obj.x >> 20] == 1 || ban_map[obj.y >> 20][obj.x >> 20] == 3)) {
					if (obj.x_add < 0) {
						obj.x = (((obj.x >> 16) + 16) & 0xfff0) << 16;
						obj.x_add = -obj.x_add >> 2;
					} else {
						obj.x = ((((obj.x >> 16) - 16) & 0xfff0) + 15) << 16;
						obj.x_add = -obj.x_add >> 2;
					}
				}
				obj.y += obj.y_add;
				if ((obj.x >> 16) < -5 || (obj.x >> 16) > 405 || (obj.y >> 16) > 260)
					obj.used = false;
				if ((obj.y >> 16) > 0 && (ban_map[obj.y >> 20][obj.x >> 20] != 0)) {
					if (obj.y_add < 0) {
						if (ban_map[obj.y >> 20][obj.x >> 20] != 2) {
							obj.y = (((obj.y >> 16) + 16) & 0xfff0) << 16;
							obj.x_add >>= 2;
							obj.y_add = -obj.y_add >> 2;
						}
					} else {
						if (ban_map[obj.y >> 20][obj.x >> 20] == 1) {
							if (obj.y_add > 131072) {
								obj.y = ((((obj.y >> 16) - 16) & 0xfff0) + 15) << 16;
								obj.x_add >>= 2;
								obj.y_add = -obj.y_add >> 2;
							} else
								obj.used = false;
						} else if (ban_map[obj.y >> 20][obj.x >> 20] == 3) {
							obj.y = ((((obj.y >> 16) - 16) & 0xfff0) + 15) << 16;
							if (obj.y_add > 131072)
								obj.y_add = -obj.y_add >> 2;
							else
								obj.y_add = 0;
						}
					}
				}
				if (obj.x_add < 0 && obj.x_add > -16384)
					obj.x_add = -16384;
				if (obj.x_add > 0 && obj.x_add < 16384)
					obj.x_add = 16384;
				if (obj.used) {
					s1 = (int)(atan2(obj.y_add, obj.x_add) * 4 / M_PI);
					if (s1 < 0)
						s1 += 8;
					if (s1 < 0)
						s1 = 0;
					if (s1 > 7)
						s1 = 7;
					add_pob(obj.x >> 16, obj.y >> 16, obj.frame + s1);
				}
				break;
			case OBJ_FLESH:
				if (rnd(100) < 30) {
					if (obj.frame == 76)
						add_object(OBJ_FLESH_TRACE, obj.x >> 16, obj.y >> 16, 0, 0, OBJ_ANIM_FLESH_TRACE, 1);
					else if (obj.frame == 77)
						add_object(OBJ_FLESH_TRACE, obj.x >> 16, obj.y >> 16, 0, 0, OBJ_ANIM_FLESH_TRACE, 2);
					else if (obj.frame == 78)
						add_object(OBJ_FLESH_TRACE, obj.x >> 16, obj.y >> 16, 0, 0, OBJ_ANIM_FLESH_TRACE, 3);
				}
				if (ban_map[obj.y >> 20][obj.x >> 20] == 0) {
					obj.y_add += 3072;
					if (obj.y_add > 196608)
						obj.y_add = 196608;
				} else if (ban_map[obj.y >> 20][obj.x >> 20] == 2) {
					if (obj.x_add < 0) {
						if (obj.x_add < -65536)
							obj.x_add = -65536;
						obj.x_add += 1024;
						if (obj.x_add > 0)
							obj.x_add = 0;
					} else {
						if (obj.x_add > 65536)
							obj.x_add = 65536;
						obj.x_add -= 1024;
						if (obj.x_add < 0)
							obj.x_add = 0;
					}
					obj.y_add += 1024;
					if (obj.y_add < -65536)
						obj.y_add = -65536;
					if (obj.y_add > 65536)
						obj.y_add = 65536;
				}
				obj.x += obj.x_add;
				if ((obj.y >> 16) > 0 && (ban_map[obj.y >> 20][obj.x >> 20] == 1 || ban_map[obj.y >> 20][obj.x >> 20] == 3)) {
					if (obj.x_add < 0) {
						obj.x = (((obj.x >> 16) + 16) & 0xfff0) << 16;
						obj.x_add = -obj.x_add >> 2;
					} else {
						obj.x = ((((obj.x >> 16) - 16) & 0xfff0) + 15) << 16;
						obj.x_add = -obj.x_add >> 2;
					}
				}
				obj.y += obj.y_add;
				if ((obj.x >> 16) < -5 || (obj.x >> 16) > 405 || (obj.y >> 16) > 260)
					obj.used = false;
				if ((obj.y >> 16) > 0 && (ban_map[obj.y >> 20][obj.x >> 20] != 0)) {
					if (obj.y_add < 0) {
						if (ban_map[obj.y >> 20][obj.x >> 20] != 2) {
							obj.y = (((obj.y >> 16) + 16) & 0xfff0) << 16;
							obj.x_add >>= 2;
							obj.y_add = -obj.y_add >> 2;
						}
					} else {
						if (ban_map[obj.y >> 20][obj.x >> 20] == 1) {
							if (obj.y_add > 131072) {
								obj.y = ((((obj.y >> 16) - 16) & 0xfff0) + 15) << 16;
								obj.x_add >>= 2;
								obj.y_add = -obj.y_add >> 2;
							} else {
								if (rnd(100) < 10) {
									s1 = rnd(4) - 2;
									add_leftovers(0, obj.x >> 16, (obj.y >> 16) + s1, obj.frame);
									add_leftovers(1, obj.x >> 16, (obj.y >> 16) + s1, obj.frame);
								}
								obj.used = false;
							}
						} else if (ban_map[obj.y >> 20][obj.x >> 20] == 3) {
							obj.y = ((((obj.y >> 16) - 16) & 0xfff0) + 15) << 16;
							if (obj.y_add > 131072)
								obj.y_add = -obj.y_add >> 2;
							else
								obj.y_add = 0;
						}
					}
				}
				if (obj.x_add < 0 && obj.x_add > -16384)
					obj.x_add = -16384;
				if (obj.x_add > 0 && obj.x_add < 16384)
					obj.x_add = 16384;
				if (obj.used)
					add_pob(obj.x >> 16, obj.y >> 16, obj.frame);
				break;
			case OBJ_FLESH_TRACE:
				obj.ticks--;
				if (obj.ticks <= 0) {
					obj.frame++;
					if (obj.frame >= object_anims[obj.anim].num_frames)
						obj.used = false;
					else {
						obj.ticks = object_anims[obj.anim].frame[obj.frame].ticks;
						obj.image = object_anims[obj.anim].frame[obj.frame].image;
					}
				}
				if (obj.used)
					add_pob(obj.x >> 16, obj.y >> 16, obj.image);
				break;
			}
		}
	}
}


function add_pob(x, y, image) {
    var page_info = main_info.page_info;
	if (page_info.num_pobs >= NUM_POBS) {
		return;
    }
    debug(page_info.num_pobs + " " + x + " " + y + " " + y);
    page_info.pobs[page_info.num_pobs] = { x : x, y : y, image : image };
	page_info.num_pobs++;
}


function draw() {
    var ctx = main_info.draw_page;

    var level = document.getElementById('level');
    ctx.drawImage(level, 0, 0);

    ctx.fillStyle = "blue";
    draw_pobs(ctx);

    var mask = document.getElementById('mask');
    ctx.drawImage(mask, 0, 0);
}

function game_loop() {
    steer_players();
    collision_check();
    main_info.page_info.num_pobs = 0;
    update_objects();
    draw();
}

function debug(str) {
    document.getElementById('debug').innerHTML = str;
}

function pump() {
    while (1) {
        ++frame;
        
        game_loop();
        var now = timeGetTime();
        var time_diff = next_time - now;
        next_time += (1000 / 60);

        if (time_diff>0) {
            // we have time left
            setTimeout("pump()", time_diff);
            break;
        }
        debug("time exceed: " + time_diff);
    }
}

function init() {
    var canvas = document.getElementById('screen');
    var ctx = canvas.getContext('2d');
    main_info.draw_page = ctx;
    ctx.mozImageSmoothingEnabled = false;
    
    player = [];
    player[0] = create_player([37,39,38]);
    player[0].enabled = true;
    player[1] = create_player([65,68,87]);
    player[2] = create_player([100,102,104]);
    player[3] = create_player([74,76,73]);

    document.onkeydown = onKeyDown;
    document.onkeyup = onKeyUp;
    next_time = timeGetTime() + 1000;

    pump();
}