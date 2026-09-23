package com.god.thirdLine;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.god.thirdLine.mapper")
public class ThirdLineApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(ThirdLineApiApplication.class, args);
    }

}
