/*
 Navicat Premium Dump SQL

 Source Server         : localhost_3306
 Source Server Type    : MySQL
 Source Server Version : 80408 (8.4.8)
 Source Host           : localhost:3306
 Source Schema         : easylive

 Target Server Type    : MySQL
 Target Server Version : 80408 (8.4.8)
 File Encoding         : 65001

 Date: 07/07/2026 09:15:33
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for category_info
-- ----------------------------
DROP TABLE IF EXISTS `category_info`;
CREATE TABLE `category_info`  (
  `category_id` int NOT NULL AUTO_INCREMENT COMMENT '自增分类ID',
  `category_code` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '分类编码',
  `category_name` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '分类名称',
  `p_category_id` int NOT NULL COMMENT '父级分类ID',
  `icon` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '图标',
  `background` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '背景图',
  `sort` tinyint NOT NULL COMMENT '排序号',
  PRIMARY KEY (`category_id`) USING BTREE,
  UNIQUE INDEX `idx_key_category_code`(`category_code` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 34 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '分类信息' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of category_info
-- ----------------------------

-- ----------------------------
-- Table structure for user_info
-- ----------------------------
DROP TABLE IF EXISTS `user_info`;
CREATE TABLE `user_info`  (
  `user_id` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户id',
  `email` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '邮箱',
  `nick_name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '昵称',
  `password` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '密码',
  `sex` int NULL DEFAULT NULL COMMENT '0:女 1:男 2:保密',
  `birthday` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '生日',
  `school` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '学校',
  `person_introduction` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '个人简介',
  `join_time` datetime NULL DEFAULT NULL COMMENT '加入时间',
  `last_login_time` datetime NULL DEFAULT NULL COMMENT '最后登录时间',
  `last_login_ip` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '最后登录ip',
  `status` int NULL DEFAULT NULL COMMENT '0:禁用 1:正常',
  `notice_info` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '空间公告',
  `total_coin` int NULL DEFAULT NULL COMMENT '总硬币数',
  `current_coin` int NULL DEFAULT NULL COMMENT '当前硬币数',
  `theme` int NULL DEFAULT NULL COMMENT '主题',
  PRIMARY KEY (`user_id`) USING BTREE,
  UNIQUE INDEX `idx_key_email`(`email` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户信息' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user_info
-- ----------------------------
INSERT INTO `user_info` VALUES ('0160368824', 'test@test.com', 'test', '05a671c66aefea124cc08b76ea6d30bb', NULL, NULL, NULL, NULL, '2026-07-06 17:44:52', '2026-07-06 21:21:06', '0:0:0:0:0:0:0:1', 1, NULL, 0, 0, 1);
INSERT INTO `user_info` VALUES ('3233754018', 'test_reg_2024@example.com', '测试用户2024', 'afdd0b4ad2ec172c586e2150770fbf9e', NULL, NULL, NULL, NULL, '2026-06-29 15:57:53', '2026-06-30 14:58:15', '127.0.0.1', 1, NULL, 0, 0, 1);

SET FOREIGN_KEY_CHECKS = 1;
