// Three.js r186 - Node System

// global
diagnostic( off, derivative_uniformity );


// structs

struct OutputStruct {
	@location( 0 ) color: vec4<f32>
};
var<private> output : OutputStruct;

// uniforms
@binding( 1 ) @group( 1 ) var nodeUniform6_sampler : sampler;
@binding( 2 ) @group( 1 ) var nodeUniform6 : texture_2d<f32>;
@binding( 3 ) @group( 1 ) var nodeUniform21_sampler : sampler_comparison;
@binding( 4 ) @group( 1 ) var nodeUniform21 : texture_depth_2d;

struct objectStruct {
	nodeUniform0 : f32,
	nodeUniform1 : f32,
	nodeUniform3 : mat3x3<f32>,
	nodeUniform4 : vec3<f32>,
	nodeUniform5 : f32,
	nodeUniform7 : mat4x4<f32>,
	nodeUniform29 : vec3<f32>,
	nodeUniform30 : vec3<f32>,
	nodeUniform32 : vec3<f32>,
	nodeUniform33 : f32
};
@binding( 0 ) @group( 1 )
var<uniform> object : objectStruct;

struct renderStruct {
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform9 : vec3<f32>,
	nodeUniform11 : vec3<f32>,
	nodeUniform8 : vec3<f32>,
	nodeUniform14 : vec3<f32>,
	nodeUniform17 : vec3<f32>,
	nodeUniform26 : vec3<f32>,
	nodeUniform27 : f32,
	nodeUniform28 : f32,
	nodeUniform12 : vec3<f32>,
	nodeUniform13 : vec3<f32>,
	nodeUniform15 : vec3<f32>,
	nodeUniform16 : vec3<f32>,
	nodeUniform25 : vec3<f32>,
	nodeUniform18 : mat4x4<f32>,
	nodeUniform19 : f32,
	nodeUniform20 : f32,
	nodeUniform24 : f32,
	cameraPosition : vec3<f32>,
	nodeUniform22 : f32,
	nodeUniform23 : vec2<f32>
};
@binding( 0 ) @group( 0 )
var<uniform> render : renderStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> nodeVar0 : f32;
var<private> nodeVar1 : u32;
var<private> nodeVar2 : u32;
var<private> nodeVar3 : f32;
var<private> nodeVar4 : f32;
var<private> nodeVar5 : f32;
var<private> nodeVar6 : f32;
var<private> nodeVar7 : u32;
var<private> nodeVar8 : u32;
var<private> nodeVar9 : f32;
var<private> nodeVar10 : f32;
var<private> nodeVar11 : u32;
var<private> nodeVar12 : u32;
var<private> nodeVar13 : f32;
var<private> nodeVar14 : f32;
var<private> nodeVar15 : f32;
var<private> nodeVar16 : u32;
var<private> nodeVar17 : u32;
var<private> nodeVar18 : f32;
var<private> nodeVar19 : u32;
var<private> nodeVar20 : u32;
var<private> nodeVar21 : f32;
var<private> nodeVar22 : vec3<f32>;
var<private> nodeVar23 : f32;
var<private> nodeVar24 : f32;
var<private> nodeVar25 : f32;
var<private> nodeVar26 : f32;
var<private> nodeVar27 : f32;
var<private> nodeVar28 : f32;
var<private> nodeVar29 : f32;
var<private> nodeVar30 : f32;
var<private> nodeVar31 : f32;
var<private> nodeVar32 : f32;
var<private> nodeVar33 : f32;
var<private> Metalness : f32;
var<private> Roughness : f32;
var<private> normalViewGeometry : vec3<f32>;
var<private> nodeVar34 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> Output : vec4<f32>;
var<private> nodeVar35 : vec3<f32>;
var<private> nodeVar36 : vec3<f32>;
var<private> NORMAL_normalView : vec3<f32>;
var<private> NORMAL_nodeVar37 : vec3<f32>;
var<private> NORMAL_nodeVar38 : f32;
var<private> nodeVar39 : f32;
var<private> nodeVar40 : vec3<f32>;
var<private> normalView : vec3<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar41 : f32;
var<private> nodeVar42 : vec2<f32>;
var<private> nodeVar43 : f32;
var<private> nodeVar44 : f32;
var<private> nodeVar45 : f32;
var<private> nodeVar46 : f32;
var<private> nodeVar47 : vec3<f32>;
var<private> nodeVar48 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar49 : f32;
var<private> nodeVar50 : f32;
var<private> nodeVar51 : f32;
var<private> nodeVar52 : vec3<f32>;
var<private> nodeVar53 : vec3<f32>;
var<private> nodeVar54 : vec3<f32>;
var<private> nodeVar55 : vec4<f32>;
var<private> nodeVar56 : vec4<f32>;
var<private> nodeVar57 : vec3<f32>;
var<private> nodeVar58 : vec3<f32>;
var<private> nodeVar59 : f32;
var<private> nodeVar60 : vec3<f32>;
var<private> nodeVar61 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar62 : vec3<f32>;
var<private> nodeVar63 : vec3<f32>;
var<private> nodeVar64 : vec3<f32>;
var<private> nodeVar65 : vec3<f32>;
var<private> nodeVar66 : f32;
var<private> nodeVar67 : f32;
var<private> nodeVar68 : f32;
var<private> nodeVar69 : vec3<f32>;
var<private> nodeVar70 : vec3<f32>;
var<private> nodeVar71 : vec3<f32>;
var<private> nodeVar72 : vec3<f32>;
var<private> nodeVar73 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar74 : vec3<f32>;
var<private> nodeVar75 : f32;
var<private> nodeVar76 : f32;
var<private> nodeVar77 : f32;
var<private> nodeVar78 : vec3<f32>;
var<private> nodeVar79 : vec3<f32>;
var<private> nodeVar80 : vec3<f32>;
var<private> nodeVar81 : vec3<f32>;
var<private> nodeVar82 : vec3<f32>;
var<private> nodeVar83 : vec4<f32>;
var<private> nodeVar84 : vec4<f32>;
var<private> nodeVar85 : vec3<f32>;
var<private> nodeVar86 : vec3<f32>;
var<private> nodeVar87 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar88 : f32;
var<private> nodeVar89 : vec4<f32>;
var<private> nodeVar90 : vec3<f32>;
var<private> nodeVar91 : vec3<f32>;
var<private> nodeVar92 : f32;
var<private> nodeVar93 : f32;
var<private> nodeVar94 : vec2<f32>;
var<private> nodeVar95 : f32;
var<private> nodeVar96 : vec2<f32>;
var<private> nodeVar97 : f32;
var<private> nodeVar98 : vec2<f32>;
var<private> nodeVar99 : f32;
var<private> nodeVar100 : vec2<f32>;
var<private> nodeVar101 : f32;
var<private> nodeVar102 : vec2<f32>;
var<private> nodeVar103 : f32;
var<private> nodeVar104 : f32;
var<private> nodeVar105 : vec3<f32>;
var<private> nodeVar106 : vec3<f32>;
var<private> nodeVar107 : vec3<f32>;
var<private> nodeVar108 : vec3<f32>;
var<private> nodeVar109 : vec3<f32>;
var<private> nodeVar110 : vec3<f32>;
var<private> nodeVar111 : f32;
var<private> nodeVar112 : f32;
var<private> nodeVar113 : f32;
var<private> nodeVar114 : vec3<f32>;
var<private> nodeVar115 : vec3<f32>;
var<private> nodeVar116 : vec3<f32>;
var<private> nodeVar117 : vec3<f32>;
var<private> nodeVar118 : vec3<f32>;
var<private> nodeVar119 : vec3<f32>;
var<private> nodeVar120 : f32;
var<private> nodeVar121 : f32;
var<private> nodeVar122 : f32;
var<private> nodeVar123 : vec3<f32>;
var<private> nodeVar124 : vec3<f32>;
var<private> nodeVar125 : vec3<f32>;
var<private> nodeVar126 : vec3<f32>;
var<private> nodeVar127 : vec3<f32>;
var<private> nodeVar128 : vec3<f32>;
var<private> nodeVar129 : f32;
var<private> nodeVar130 : f32;
var<private> nodeVar131 : f32;
var<private> nodeVar132 : f32;
var<private> nodeVar133 : f32;
var<private> nodeVar134 : vec3<f32>;
var<private> nodeVar135 : vec3<f32>;
var<private> nodeVar136 : vec3<f32>;
var<private> nodeVar137 : vec3<f32>;
var<private> nodeVar138 : vec3<f32>;
var<private> nodeVar139 : vec3<f32>;
var<private> nodeVar140 : vec3<f32>;
var<private> nodeVar141 : f32;
var<private> nodeVar142 : f32;
var<private> nodeVar143 : f32;
var<private> nodeVar144 : vec3<f32>;
var<private> nodeVar145 : vec3<f32>;
var<private> nodeVar146 : vec3<f32>;
var<private> nodeVar147 : vec3<f32>;
var<private> nodeVar148 : vec3<f32>;
var<private> nodeVar149 : vec3<f32>;
var<private> nodeVar150 : f32;
var<private> nodeVar151 : f32;
var<private> nodeVar152 : f32;
var<private> nodeVar153 : vec3<f32>;
var<private> nodeVar154 : vec3<f32>;
var<private> nodeVar155 : vec3<f32>;
var<private> nodeVar156 : vec3<f32>;
var<private> nodeVar157 : vec3<f32>;
var<private> nodeVar158 : vec3<f32>;
var<private> nodeVar159 : vec3<f32>;
var<private> nodeVar160 : f32;
var<private> nodeVar161 : vec3<f32>;
var<private> nodeVar162 : vec3<f32>;
var<private> nodeVar163 : vec3<f32>;
var<private> nodeVar164 : vec3<f32>;
var<private> nodeVar165 : vec3<f32>;
var<private> nodeVar166 : vec3<f32>;
var<private> nodeVar167 : vec3<f32>;
var<private> nodeVar168 : f32;
var<private> nodeVar169 : f32;
var<private> nodeVar170 : f32;
var<private> nodeVar171 : vec3<f32>;
var<private> nodeVar172 : vec3<f32>;
var<private> nodeVar173 : vec3<f32>;
var<private> nodeVar174 : vec3<f32>;
var<private> nodeVar175 : vec3<f32>;
var<private> nodeVar176 : vec3<f32>;
var<private> nodeVar177 : vec3<f32>;
var<private> nodeVar178 : vec3<f32>;
var<private> nodeVar179 : vec3<f32>;
var<private> nodeVar180 : vec3<f32>;
var<private> nodeVar181 : vec3<f32>;
var<private> nodeVar182 : vec3<f32>;
var<private> nodeVar183 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar184 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar185 : vec3<f32>;
var<private> nodeVar186 : f32;
var<private> nodeVar187 : vec3<f32>;
var<private> nodeVar188 : vec3<f32>;
var<private> nodeVar189 : vec3<f32>;
var<private> nodeVar190 : vec3<f32>;
var<private> nodeVar191 : vec3<f32>;
var<private> nodeVar192 : vec3<f32>;
var<private> nodeVar193 : vec3<f32>;
var<private> nodeVar194 : f32;
var<private> nodeVar195 : f32;
var<private> nodeVar196 : f32;
var<private> nodeVar197 : vec3<f32>;
var<private> nodeVar198 : vec3<f32>;
var<private> nodeVar199 : vec3<f32>;
var<private> nodeVar200 : vec3<f32>;
var<private> nodeVar201 : vec3<f32>;
var<private> nodeVar202 : vec3<f32>;
var<private> nodeVar203 : vec3<f32>;
var<private> nodeVar204 : f32;
var<private> nodeVar205 : vec3<f32>;
var<private> nodeVar206 : vec3<f32>;
var<private> nodeVar207 : vec3<f32>;
var<private> nodeVar208 : vec3<f32>;
var<private> nodeVar209 : vec3<f32>;
var<private> nodeVar210 : vec3<f32>;
var<private> nodeVar211 : vec3<f32>;
var<private> nodeVar212 : f32;
var<private> nodeVar213 : f32;
var<private> nodeVar214 : f32;
var<private> nodeVar215 : vec3<f32>;
var<private> nodeVar216 : vec3<f32>;
var<private> nodeVar217 : vec3<f32>;
var<private> nodeVar218 : vec3<f32>;
var<private> nodeVar219 : vec3<f32>;
var<private> nodeVar220 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar221 : vec3<f32>;
var<private> nodeVar222 : vec3<f32>;
var<private> nodeVar223 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar224 : vec3<f32>;
var<private> nodeVar225 : vec3<f32>;
var<private> nodeVar226 : vec3<f32>;
var<private> nodeVar227 : vec3<f32>;
var<private> nodeVar228 : vec3<f32>;
var<private> nodeVar229 : vec3<f32>;
var<private> nodeVar230 : vec3<f32>;
var<private> nodeVar231 : vec3<f32>;
var<private> nodeVar232 : vec3<f32>;
var<private> nodeVar233 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar234 : vec3<f32>;
var<private> nodeVar235 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar236 : vec3<f32>;
var<private> nodeVar237 : f32;
var<private> nodeVar238 : f32;
var<private> nodeVar239 : f32;
var<private> nodeVar240 : f32;
var<private> nodeVar241 : f32;
var<private> nodeVar242 : f32;
var<private> nodeVar243 : f32;
var<private> nodeVar244 : f32;
var<private> nodeVar245 : f32;
var<private> nodeVar246 : f32;
var<private> nodeVar247 : f32;
var<private> nodeVar248 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar249 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar250 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar251 : vec3<f32>;
var<private> nodeVar252 : f32;
var<private> nodeVar253 : vec4<f32>;

// codes
fn tsl_mod_float( x : f32, y : f32 ) -> f32 { return x - y * floor( x / y ); }
fn mx_floor ( x : f32 ) -> i32 {

	var nodeVar0 : f32;

	nodeVar0 = x;

	return i32( floor( nodeVar0 ) );

}


fn mx_fade ( t : f32 ) -> f32 {

	var nodeVar0 : f32;

	nodeVar0 = t;

	return ( ( ( nodeVar0 * nodeVar0 ) * nodeVar0 ) * ( ( nodeVar0 * ( ( nodeVar0 * 6.0 ) - 15.0 ) ) + 10.0 ) );

}


fn mx_rotl32 ( x : u32, k : i32 ) -> u32 {

	var nodeVar0 : i32;
	var nodeVar1 : u32;

	nodeVar0 = k;
	nodeVar1 = x;

	return ( ( nodeVar1 << u32( nodeVar0 ) ) | ( nodeVar1 >> u32( ( 32 - nodeVar0 ) ) ) );

}


fn mx_bjfinal ( a : u32, b : u32, c : u32 ) -> u32 {

	var nodeVar0 : u32;
	var nodeVar1 : u32;
	var nodeVar2 : u32;

	nodeVar0 = c;
	nodeVar1 = b;
	nodeVar2 = a;
	nodeVar0 = ( nodeVar0 ^ nodeVar1 );
	nodeVar0 = ( nodeVar0 - mx_rotl32( nodeVar1, 14 ) );
	nodeVar2 = ( nodeVar2 ^ nodeVar0 );
	nodeVar2 = ( nodeVar2 - mx_rotl32( nodeVar0, 11 ) );
	nodeVar1 = ( nodeVar1 ^ nodeVar2 );
	nodeVar1 = ( nodeVar1 - mx_rotl32( nodeVar2, 25 ) );
	nodeVar0 = ( nodeVar0 ^ nodeVar1 );
	nodeVar0 = ( nodeVar0 - mx_rotl32( nodeVar1, 16 ) );
	nodeVar2 = ( nodeVar2 ^ nodeVar0 );
	nodeVar2 = ( nodeVar2 - mx_rotl32( nodeVar0, 4 ) );
	nodeVar1 = ( nodeVar1 ^ nodeVar2 );
	nodeVar1 = ( nodeVar1 - mx_rotl32( nodeVar2, 14 ) );
	nodeVar0 = ( nodeVar0 ^ nodeVar1 );
	nodeVar0 = ( nodeVar0 - mx_rotl32( nodeVar1, 24 ) );

	return nodeVar0;

}


fn mx_hash_int_2 ( x : i32, y : i32, z : i32 ) -> u32 {

	var nodeVar0 : i32;
	var nodeVar1 : i32;
	var nodeVar2 : i32;
	var nodeVar3 : u32;
	var nodeVar4 : u32;
	var nodeVar5 : u32;
	var nodeVar6 : u32;

	nodeVar0 = z;
	nodeVar1 = y;
	nodeVar2 = x;
	nodeVar3 = 3u;
	nodeVar4 = 0u;
	nodeVar5 = 0u;
	nodeVar6 = 0u;
	nodeVar6 = ( ( 3735928559u + ( nodeVar3 << 2u ) ) + 13u );
	nodeVar5 = nodeVar6;
	nodeVar4 = nodeVar5;
	nodeVar4 = ( nodeVar4 + u32( nodeVar2 ) );
	nodeVar5 = ( nodeVar5 + u32( nodeVar1 ) );
	nodeVar6 = ( nodeVar6 + u32( nodeVar0 ) );

	return mx_bjfinal( nodeVar4, nodeVar5, nodeVar6 );

}


fn mx_select ( b : bool, t : f32, f : f32 ) -> f32 {

	var nodeVar0 : f32;
	var nodeVar1 : f32;
	var nodeVar2 : bool;
	var nodeVar3 : f32;

	nodeVar0 = f;
	nodeVar1 = t;
	nodeVar2 = b;

	return select( nodeVar0, nodeVar1, nodeVar2 );

}


fn mx_negate_if ( val : f32, b : bool ) -> f32 {

	var nodeVar0 : bool;
	var nodeVar1 : f32;
	var nodeVar2 : f32;

	nodeVar0 = b;
	nodeVar1 = val;

	return select( nodeVar1, ( - nodeVar1 ), nodeVar0 );

}


fn mx_gradient_float_1 ( hash : u32, x : f32, y : f32, z : f32 ) -> f32 {

	var nodeVar0 : f32;
	var nodeVar1 : f32;
	var nodeVar2 : f32;
	var nodeVar3 : u32;
	var nodeVar4 : u32;
	var nodeVar5 : f32;
	var nodeVar6 : f32;

	nodeVar0 = z;
	nodeVar1 = y;
	nodeVar2 = x;
	nodeVar3 = hash;
	nodeVar4 = ( nodeVar3 & 15u );
	nodeVar5 = mx_select( ( nodeVar4 < 8u ), nodeVar2, nodeVar1 );
	nodeVar6 = mx_select( ( nodeVar4 < 4u ), nodeVar1, mx_select( ( ( nodeVar4 == 12u ) || ( nodeVar4 == 14u ) ), nodeVar2, nodeVar0 ) );

	return ( mx_negate_if( nodeVar5, bool( ( nodeVar4 & 1u ) ) ) + mx_negate_if( nodeVar6, bool( ( nodeVar4 & 2u ) ) ) );

}


fn mx_trilerp_0 ( v0 : f32, v1 : f32, v2 : f32, v3 : f32, v4 : f32, v5 : f32, v6 : f32, v7 : f32, s : f32, t : f32, r : f32 ) -> f32 {

	var nodeVar0 : f32;
	var nodeVar1 : f32;
	var nodeVar2 : f32;
	var nodeVar3 : f32;
	var nodeVar4 : f32;
	var nodeVar5 : f32;
	var nodeVar6 : f32;
	var nodeVar7 : f32;
	var nodeVar8 : f32;
	var nodeVar9 : f32;
	var nodeVar10 : f32;
	var nodeVar11 : f32;
	var nodeVar12 : f32;
	var nodeVar13 : f32;

	nodeVar0 = r;
	nodeVar1 = t;
	nodeVar2 = s;
	nodeVar3 = v7;
	nodeVar4 = v6;
	nodeVar5 = v5;
	nodeVar6 = v4;
	nodeVar7 = v3;
	nodeVar8 = v2;
	nodeVar9 = v1;
	nodeVar10 = v0;
	nodeVar11 = ( 1.0 - nodeVar2 );
	nodeVar12 = ( 1.0 - nodeVar1 );
	nodeVar13 = ( 1.0 - nodeVar0 );

	return ( ( nodeVar13 * ( ( nodeVar12 * ( ( nodeVar10 * nodeVar11 ) + ( nodeVar9 * nodeVar2 ) ) ) + ( nodeVar1 * ( ( nodeVar8 * nodeVar11 ) + ( nodeVar7 * nodeVar2 ) ) ) ) ) + ( nodeVar0 * ( ( nodeVar12 * ( ( nodeVar6 * nodeVar11 ) + ( nodeVar5 * nodeVar2 ) ) ) + ( nodeVar1 * ( ( nodeVar4 * nodeVar11 ) + ( nodeVar3 * nodeVar2 ) ) ) ) ) );

}


fn mx_gradient_scale3d_0 ( v : f32 ) -> f32 {

	var nodeVar0 : f32;

	nodeVar0 = v;

	return ( 0.982 * nodeVar0 );

}


fn mx_perlin_noise_float_1 ( p : vec3<f32> ) -> f32 {

	var nodeVar0 : vec3<f32>;
	var nodeVar1 : i32;
	var nodeVar2 : i32;
	var nodeVar3 : i32;
	var nodeVar4 : f32;
	var nodeVar5 : f32;
	var nodeVar6 : f32;
	var nodeVar7 : f32;
	var nodeVar8 : f32;
	var nodeVar9 : f32;
	var nodeVar10 : f32;
	var nodeVar11 : f32;
	var nodeVar12 : f32;
	var nodeVar13 : f32;

	nodeVar0 = p;
	nodeVar1 = 0;
	nodeVar2 = 0;
	nodeVar3 = 0;
	nodeVar4 = nodeVar0.x;
	nodeVar1 = mx_floor( nodeVar4 );
	nodeVar5 = ( nodeVar4 - f32( nodeVar1 ) );
	nodeVar6 = nodeVar0.y;
	nodeVar2 = mx_floor( nodeVar6 );
	nodeVar7 = ( nodeVar6 - f32( nodeVar2 ) );
	nodeVar8 = nodeVar0.z;
	nodeVar3 = mx_floor( nodeVar8 );
	nodeVar9 = ( nodeVar8 - f32( nodeVar3 ) );
	nodeVar10 = mx_fade( nodeVar5 );
	nodeVar11 = mx_fade( nodeVar7 );
	nodeVar12 = mx_fade( nodeVar9 );
	nodeVar13 = mx_trilerp_0( mx_gradient_float_1( mx_hash_int_2( nodeVar1, nodeVar2, nodeVar3 ), nodeVar5, nodeVar7, nodeVar9 ), mx_gradient_float_1( mx_hash_int_2( ( nodeVar1 + 1 ), nodeVar2, nodeVar3 ), ( nodeVar5 - 1.0 ), nodeVar7, nodeVar9 ), mx_gradient_float_1( mx_hash_int_2( nodeVar1, ( nodeVar2 + 1 ), nodeVar3 ), nodeVar5, ( nodeVar7 - 1.0 ), nodeVar9 ), mx_gradient_float_1( mx_hash_int_2( ( nodeVar1 + 1 ), ( nodeVar2 + 1 ), nodeVar3 ), ( nodeVar5 - 1.0 ), ( nodeVar7 - 1.0 ), nodeVar9 ), mx_gradient_float_1( mx_hash_int_2( nodeVar1, nodeVar2, ( nodeVar3 + 1 ) ), nodeVar5, nodeVar7, ( nodeVar9 - 1.0 ) ), mx_gradient_float_1( mx_hash_int_2( ( nodeVar1 + 1 ), nodeVar2, ( nodeVar3 + 1 ) ), ( nodeVar5 - 1.0 ), nodeVar7, ( nodeVar9 - 1.0 ) ), mx_gradient_float_1( mx_hash_int_2( nodeVar1, ( nodeVar2 + 1 ), ( nodeVar3 + 1 ) ), nodeVar5, ( nodeVar7 - 1.0 ), ( nodeVar9 - 1.0 ) ), mx_gradient_float_1( mx_hash_int_2( ( nodeVar1 + 1 ), ( nodeVar2 + 1 ), ( nodeVar3 + 1 ) ), ( nodeVar5 - 1.0 ), ( nodeVar7 - 1.0 ), ( nodeVar9 - 1.0 ) ), nodeVar10, nodeVar11, nodeVar12 );

	return mx_gradient_scale3d_0( nodeVar13 );

}


fn V_GGX_SmithCorrelated ( alpha : f32, dotNL : f32, dotNV : f32 ) -> f32 {

	var nodeVar0 : f32;

	nodeVar0 = ( alpha * alpha );

	return ( 0.5 / max( ( ( dotNL * sqrt( ( nodeVar0 + ( ( 1.0 - nodeVar0 ) * ( dotNV * dotNV ) ) ) ) ) + ( dotNV * sqrt( ( nodeVar0 + ( ( 1.0 - nodeVar0 ) * ( dotNL * dotNL ) ) ) ) ) ), 0.000001 ) );

}


fn D_GGX ( alpha : f32, dotNH : f32 ) -> f32 {

	var nodeVar0 : f32;
	var nodeVar1 : f32;

	nodeVar0 = ( alpha * alpha );
	nodeVar1 = ( 1.0 - ( ( dotNH * dotNH ) * ( 1.0 - nodeVar0 ) ) );

	return ( ( nodeVar0 / ( nodeVar1 * nodeVar1 ) ) * 0.3183098861837907 );

}


fn interleavedGradientNoise ( position : vec2<f32> ) -> f32 {

	


	return fract( ( 52.9829189 * fract( dot( position, vec2<f32>( 0.06711056, 0.00583715 ) ) ) ) );

}


fn vogelDiskSample ( sampleIndex : i32, samplesCount : i32, phi : f32 ) -> vec2<f32> {

	var nodeVar0 : f32;

	nodeVar0 = ( ( f32( sampleIndex ) * 2.399963229728653 ) + phi );

	return ( vec2<f32>( cos( nodeVar0 ), sin( nodeVar0 ) ) * vec2<f32>( sqrt( ( ( f32( sampleIndex ) + 0.5 ) / f32( samplesCount ) ) ) ) );

}




@fragment
fn main( @location( 0 ) v_positionView : vec3<f32>,
	@location( 1 ) v_normalViewGeometry : vec3<f32>,
	@location( 2 ) v_positionViewDirection : vec3<f32>,
	@location( 3 ) v_positionWorld : vec3<f32>,
	@location( 4 ) nodeVarying7 : vec3<f32>,
	@location( 5 ) nodeVarying8 : vec2<f32>,
	@location( 6 ) nodeVarying9 : vec2<f32>,
	@location( 7 ) nodeVarying10 : vec3<f32>,
	@builtin( position ) fragCoord : vec4<f32> ) -> OutputStruct {

	// flow
	// code

	nodeVar0 = floor( ( nodeVarying8.y / 0.72 ) );
	nodeVar1 = ( ( u32( ( nodeVar0 + 2.3 ) ) * 747796405u ) + 2891336453u );
	nodeVar2 = ( ( ( nodeVar1 >> ( ( nodeVar1 >> 28u ) + 4u ) ) ^ nodeVar1 ) * 277803737u );
	nodeVar3 = ( ( ( f32( ( ( nodeVar2 >> 22u ) ^ nodeVar2 ) ) * 2.3283064365386963e-10 ) * 0.2 ) + 0.28 );
	nodeVar4 = ( nodeVarying8.y - ( nodeVar0 * 0.72 ) );
	nodeVar5 = step( nodeVar3, nodeVar4 );
	nodeVar6 = ( ( nodeVar0 * 2.0 ) + nodeVar5 );
	nodeVar7 = ( ( u32( ( nodeVar6 + 11.3 ) ) * 747796405u ) + 2891336453u );
	nodeVar8 = ( ( ( nodeVar7 >> ( ( nodeVar7 >> 28u ) + 4u ) ) ^ nodeVar7 ) * 277803737u );
	nodeVar9 = step( 0.5, nodeVarying9.y );
	nodeVar10 = mix( ( ( ( f32( ( ( nodeVar8 >> 22u ) ^ nodeVar8 ) ) * 2.3283064365386963e-10 ) * 0.75 ) + 0.62 ), nodeVarying9.x, nodeVar9 );
	nodeVar11 = ( ( u32( ( nodeVar6 + 5.1 ) ) * 747796405u ) + 2891336453u );
	nodeVar12 = ( ( ( nodeVar11 >> ( ( nodeVar11 >> 28u ) + 4u ) ) ^ nodeVar11 ) * 277803737u );
	nodeVar13 = ( ( nodeVarying8.x / nodeVar10 ) + ( ( tsl_mod_float( nodeVar6, 2.0 ) * 0.5 ) + floor( ( ( f32( ( ( nodeVar12 >> 22u ) ^ nodeVar12 ) ) * 2.3283064365386963e-10 ) * 8.0 ) ) ) );
	nodeVar14 = floor( nodeVar13 );
	nodeVar15 = ( mix( nodeVar14, tsl_mod_float( nodeVar14, max( nodeVarying9.y, 1.0 ) ), nodeVar9 ) + ( nodeVar6 * 57.3 ) );
	nodeVar16 = ( ( u32( ( nodeVar15 + 19.1 ) ) * 747796405u ) + 2891336453u );
	nodeVar17 = ( ( ( nodeVar16 >> ( ( nodeVar16 >> 28u ) + 4u ) ) ^ nodeVar16 ) * 277803737u );
	nodeVar18 = ( ( f32( ( ( nodeVar17 >> 22u ) ^ nodeVar17 ) ) * 2.3283064365386963e-10 ) - 0.5 );
	nodeVar19 = ( ( u32( nodeVar15 ) * 747796405u ) + 2891336453u );
	nodeVar20 = ( ( ( nodeVar19 >> ( ( nodeVar19 >> 28u ) + 4u ) ) ^ nodeVar19 ) * 277803737u );
	nodeVar21 = ( ( ( f32( ( ( nodeVar20 >> 22u ) ^ nodeVar20 ) ) * 2.3283064365386963e-10 ) * 0.62 ) + 0.66 );
	nodeVar22 = vec3<f32>( ( nodeVarying8.x * 6.3 ), ( nodeVarying8.y * 6.3 ), ( nodeVar15 * 0.37 ) );
	nodeVar23 = ( ( mx_perlin_noise_float_1( nodeVar22 ) * 1.0 ) + 0.0 );
	nodeVar24 = smoothstep( 0.4, 0.7, ( ( mx_perlin_noise_float_1( ( nodeVar22 * vec3<f32>( 2.6 ) ) ) * 1.0 ) + 0.0 ) );
	nodeVar25 = ( ( mx_perlin_noise_float_1( vec3<f32>( ( nodeVarying8.x * 0.5 ), ( nodeVarying8.y * 0.45 ), 8.2 ) ) * 1.0 ) + 0.0 );
	nodeVar26 = fract( nodeVar13 );
	nodeVar27 = mix( nodeVar3, ( 0.72 - nodeVar3 ), nodeVar5 );
	nodeVar28 = ( ( nodeVar4 - ( nodeVar5 * nodeVar3 ) ) / nodeVar27 );
	nodeVar29 = ( min( ( min( nodeVar26, ( 1.0 - nodeVar26 ) ) * nodeVar10 ), ( min( nodeVar28, ( 1.0 - nodeVar28 ) ) * nodeVar27 ) ) + ( ( ( mx_perlin_noise_float_1( vec3<f32>( ( nodeVarying8.x * 7.1 ), ( nodeVarying8.y * 7.1 ), 1.7 ) ) * 1.0 ) + 0.0 ) * 0.011 ) );
	nodeVar30 = max( fwidth( nodeVarying8.x ), fwidth( nodeVarying8.y ) );
	nodeVar31 = ( ( nodeVar30 * 0.75 ) + 0.0015 );
	nodeVar32 = mix( ( 1.0 - smoothstep( ( 0.024 - nodeVar31 ), ( 0.024 + nodeVar31 ), nodeVar29 ) ), 0.17, smoothstep( 0.1, 0.34, nodeVar30 ) );
	nodeVar33 = smoothstep( 1.7, 0.0, ( ( nodeVarying10.z + ( nodeVar23 * 0.35 ) ) + ( nodeVar25 * 0.4 ) ) );
	DiffuseColor = vec4<f32>( mix( ( ( nodeVarying7 * vec3<f32>( ( 1.0 + ( nodeVar18 * 0.12 ) ), ( 1.0 - ( nodeVar18 * 0.02 ) ), ( 1.0 - ( nodeVar18 * 0.14 ) ) ) ) * vec3<f32>( max( ( ( ( ( ( ( ( ( ( ( nodeVar21 + ( nodeVar23 * 0.11 ) ) + 0.0 ) + ( nodeVar24 * 0.07 ) ) + ( ( ( mx_perlin_noise_float_1( vec3<f32>( ( nodeVarying8.x * 0.85 ), ( nodeVarying8.y * 0.16 ), 3.3 ) ) * 1.0 ) + 0.0 ) * 0.1 ) ) + ( nodeVar25 * 0.12 ) ) + ( smoothstep( 0.32, 0.0, ( min( nodeVarying10.x, nodeVarying10.y ) + ( nodeVar23 * 0.08 ) ) ) * 0.16 ) ) + ( ( smoothstep( 0.08, 0.035, nodeVar29 ) * ( 1.0 - nodeVar32 ) ) * 0.1 ) ) * ( ( smoothstep( 0.0, 0.2, nodeVar29 ) * 0.16 ) + 0.84 ) ) * ( 1.0 - ( nodeVar33 * 0.4 ) ) ) * ( 1.0 - ( nodeVar32 * 0.65 ) ) ), 0.0 ) ) ), ( vec3<f32>( 0.07, 0.09, 0.03 ) * vec3<f32>( nodeVar21 ) ), ( ( ( ( nodeVar33 * smoothstep( 0.0, 0.55, ( ( ( mx_perlin_noise_float_1( vec3<f32>( ( nodeVarying8.x * 2.4 ), ( nodeVarying8.y * 2.4 ), 9.1 ) ) * 1.0 ) + 0.0 ) + 0.15 ) ) ) * smoothstep( 1.1, 0.0, nodeVarying10.z ) ) * ( 1.0 - nodeVar32 ) ) * 0.6 ) ), 1.0 );
	DiffuseColor.w = ( DiffuseColor.w * object.nodeUniform0 );
	DiffuseColor.w = 1.0;
	Metalness = object.nodeUniform1;
	normalViewGeometry = normalize( v_normalViewGeometry );
	nodeVar34 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( mix( 0.93, 0.5, ( nodeVar33 * 0.75 ) ), 0.0525 ) + max( max( nodeVar34.x, nodeVar34.y ), nodeVar34.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - object.nodeUniform1 ) ) );
	EmissiveColor = ( object.nodeUniform4 * vec3<f32>( object.nodeUniform5 ) );
	nodeVar35 = dpdx( v_positionView );
	nodeVar36 = - dpdy( v_positionView );
	NORMAL_normalView = normalViewGeometry;
	NORMAL_nodeVar37 = cross( nodeVar36, NORMAL_normalView );
	NORMAL_nodeVar38 = dot( nodeVar35, NORMAL_nodeVar37 );
	nodeVar39 = ( ( ( ( ( smoothstep( 0.0, 0.07, nodeVar29 ) * 0.014 ) + ( smoothstep( 0.0, 0.02, nodeVar29 ) * 0.006 ) ) + ( ( ( mx_perlin_noise_float_1( vec3<f32>( ( nodeVarying8.x * 13.0 ), ( nodeVarying8.y * 13.0 ), nodeVar6 ) ) * 1.0 ) + 0.0 ) * 0.006 ) ) + ( nodeVar24 * -0.004 ) ) * ( 1.0 - smoothstep( 0.05, 0.22, nodeVar30 ) ) );
	nodeVar40 = ( vec3<f32>( sign( NORMAL_nodeVar38 ) ) * ( ( vec3<f32>( dpdx( nodeVar39 ) ) * NORMAL_nodeVar37 ) + ( vec3<f32>( - dpdy( nodeVar39 ) ) * cross( NORMAL_normalView, nodeVar35 ) ) ) );
	normalView = normalize( ( ( vec3<f32>( abs( NORMAL_nodeVar38 ) ) * NORMAL_normalView ) - nodeVar40 ) );
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar41 = dot( normalView, positionViewDirection );
	nodeVar42 = textureSample( nodeUniform6, nodeUniform6_sampler, vec2<f32>( Roughness, clamp( nodeVar41, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar42;
	nodeVar43 = ( dfg.x + dfg.y );
	nodeVar44 = ( 1.0 / nodeVar43 );
	nodeVar45 = nodeVar44;
	nodeVar46 = ( nodeVar45 - 1.0 );
	nodeVar47 = ( SpecularColorBlended * vec3<f32>( nodeVar46 ) );
	nodeVar48 = ( nodeVar47 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar48;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar49 = dot( normalWorld, normalize( render.nodeUniform11 ) );
	nodeVar50 = ( nodeVar49 * 0.5 );
	nodeVar51 = ( nodeVar50 + 0.5 );
	nodeVar52 = mix( render.nodeUniform8, render.nodeUniform9, nodeVar51 );
	nodeVar53 = ( irradiance + nodeVar52 );
	irradiance = nodeVar53;
	nodeVar54 = ( render.nodeUniform12 - render.nodeUniform13 );
	nodeVar55 = vec4<f32>( nodeVar54, 0.0 );
	nodeVar56 = ( render.cameraViewMatrix * nodeVar55 );
	nodeVar57 = normalize( nodeVar56.xyz );
	nodeVar58 = nodeVar57;
	nodeVar59 = dot( normalView, nodeVar58 );
	nodeVar60 = ( vec3<f32>( clamp( nodeVar59, 0.0, 1.0 ) ) * render.nodeUniform14 );
	nodeVar61 = nodeVar60;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar62 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar63 = ( nodeVar61 * nodeVar62 );
	nodeVar64 = ( nodeVar58 + positionViewDirection );
	nodeVar65 = normalize( nodeVar64 );
	nodeVar66 = dot( positionViewDirection, nodeVar65 );
	nodeVar67 = clamp( nodeVar66, 0.0, 1.0 );
	nodeVar68 = exp2( ( ( ( nodeVar67 * -5.55473 ) - 6.98316 ) * nodeVar67 ) );
	nodeVar69 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar68 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar68 ) ) );
	nodeVar70 = ( vec3<f32>( 1.0 ) - nodeVar69 );
	nodeVar71 = nodeVar70;
	nodeVar72 = ( nodeVar63 * nodeVar71 );
	nodeVar73 = ( directDiffuse + nodeVar72 );
	directDiffuse = nodeVar73;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar74 = normalize( ( nodeVar58 + positionViewDirection ) );
	nodeVar75 = clamp( dot( positionViewDirection, nodeVar74 ), 0.0, 1.0 );
	nodeVar76 = exp2( ( ( ( nodeVar75 * -5.55473 ) - 6.98316 ) * nodeVar75 ) );
	nodeVar77 = ( Roughness * Roughness );
	nodeVar78 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar76 ) ) ) + vec3<f32>( ( 1.0 * nodeVar76 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar77, clamp( dot( normalView, nodeVar58 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar77, clamp( dot( normalView, nodeVar74 ), 0.0, 1.0 ) ) ) );
	nodeVar79 = ( nodeVar61 * nodeVar78 );
	nodeVar80 = ( nodeVar79 * multiScatteringCompensation );
	nodeVar81 = ( directSpecular + nodeVar80 );
	directSpecular = nodeVar81;
	nodeVar82 = ( render.nodeUniform15 - render.nodeUniform16 );
	nodeVar83 = vec4<f32>( nodeVar82, 0.0 );
	nodeVar84 = ( render.cameraViewMatrix * nodeVar83 );
	nodeVar85 = normalize( nodeVar84.xyz );
	nodeVar86 = nodeVar85;
	nodeVar87 = dot( normalView, nodeVar86 );
	shadowPositionWorld = v_positionWorld;
	nodeVar89 = ( render.nodeUniform18 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform19 ) ) ), 1.0 ) );
	nodeVar90 = ( nodeVar89.xyz / vec3<f32>( nodeVar89.w ) );
	nodeVar91 = vec3<f32>( nodeVar90.x, ( 1.0 - nodeVar90.y ), ( nodeVar90.z + render.nodeUniform20 ) );

	if ( ( ( ( ( ( nodeVar91.x >= 0.0 ) && ( nodeVar91.x <= 1.0 ) ) && ( nodeVar91.y >= 0.0 ) ) && ( nodeVar91.y <= 1.0 ) ) && ( nodeVar91.z <= 1.0 ) ) ) {

		nodeVar92 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar93 = ( render.nodeUniform22 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform23 ).x );
		nodeVar94 = ( nodeVar91.xy + ( vogelDiskSample( 0, 5, nodeVar92 ) * vec2<f32>( nodeVar93 ) ) );
		nodeVar95 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar94, nodeVar91.z );
		nodeVar96 = ( nodeVar91.xy + ( vogelDiskSample( 1, 5, nodeVar92 ) * vec2<f32>( nodeVar93 ) ) );
		nodeVar97 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar96, nodeVar91.z );
		nodeVar98 = ( nodeVar91.xy + ( vogelDiskSample( 2, 5, nodeVar92 ) * vec2<f32>( nodeVar93 ) ) );
		nodeVar99 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar98, nodeVar91.z );
		nodeVar100 = ( nodeVar91.xy + ( vogelDiskSample( 3, 5, nodeVar92 ) * vec2<f32>( nodeVar93 ) ) );
		nodeVar101 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar100, nodeVar91.z );
		nodeVar102 = ( nodeVar91.xy + ( vogelDiskSample( 4, 5, nodeVar92 ) * vec2<f32>( nodeVar93 ) ) );
		nodeVar103 = textureSampleCompare( nodeUniform21, nodeUniform21_sampler, nodeVar102, nodeVar91.z );
		nodeVar88 = ( ( ( ( ( nodeVar95 + nodeVar97 ) + nodeVar99 ) + nodeVar101 ) + nodeVar103 ) * 0.2 );

	} else {

		nodeVar88 = 1.0;

	}

	nodeVar104 = mix( 1.0, nodeVar88, render.nodeUniform24 );
	nodeVar105 = ( vec3<f32>( clamp( nodeVar87, 0.0, 1.0 ) ) * ( render.nodeUniform17 * vec3<f32>( nodeVar104 ) ) );
	nodeVar106 = nodeVar105;
	nodeVar107 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar108 = ( nodeVar106 * nodeVar107 );
	nodeVar109 = ( nodeVar86 + positionViewDirection );
	nodeVar110 = normalize( nodeVar109 );
	nodeVar111 = dot( positionViewDirection, nodeVar110 );
	nodeVar112 = clamp( nodeVar111, 0.0, 1.0 );
	nodeVar113 = exp2( ( ( ( nodeVar112 * -5.55473 ) - 6.98316 ) * nodeVar112 ) );
	nodeVar114 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar113 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar113 ) ) );
	nodeVar115 = ( vec3<f32>( 1.0 ) - nodeVar114 );
	nodeVar116 = nodeVar115;
	nodeVar117 = ( nodeVar108 * nodeVar116 );
	nodeVar118 = ( directDiffuse + nodeVar117 );
	directDiffuse = nodeVar118;
	nodeVar119 = normalize( ( nodeVar86 + positionViewDirection ) );
	nodeVar120 = clamp( dot( positionViewDirection, nodeVar119 ), 0.0, 1.0 );
	nodeVar121 = exp2( ( ( ( nodeVar120 * -5.55473 ) - 6.98316 ) * nodeVar120 ) );
	nodeVar122 = ( Roughness * Roughness );
	nodeVar123 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar121 ) ) ) + vec3<f32>( ( 1.0 * nodeVar121 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar122, clamp( dot( normalView, nodeVar86 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar122, clamp( dot( normalView, nodeVar119 ), 0.0, 1.0 ) ) ) );
	nodeVar124 = ( nodeVar106 * nodeVar123 );
	nodeVar125 = ( nodeVar124 * multiScatteringCompensation );
	nodeVar126 = ( directSpecular + nodeVar125 );
	directSpecular = nodeVar126;
	nodeVar127 = ( render.nodeUniform25 - v_positionView );
	nodeVar128 = normalize( nodeVar127 );
	nodeVar129 = dot( normalView, nodeVar128 );

	if ( ( render.nodeUniform27 > 0.0 ) ) {

		nodeVar131 = length( nodeVar127 );
		nodeVar132 = ( nodeVar131 / render.nodeUniform27 );
		nodeVar133 = clamp( ( 1.0 - ( ( ( nodeVar132 * nodeVar132 ) * nodeVar132 ) * nodeVar132 ) ), 0.0, 1.0 );
		nodeVar130 = ( ( 1.0 / max( pow( nodeVar131, render.nodeUniform28 ), 0.01 ) ) * ( nodeVar133 * nodeVar133 ) );

	} else {

		nodeVar130 = ( 1.0 / max( pow( length( nodeVar127 ), render.nodeUniform28 ), 0.01 ) );

	}

	nodeVar134 = ( render.nodeUniform26 * vec3<f32>( nodeVar130 ) );
	nodeVar135 = ( vec3<f32>( clamp( nodeVar129, 0.0, 1.0 ) ) * nodeVar134 );
	nodeVar136 = nodeVar135;
	nodeVar137 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar138 = ( nodeVar136 * nodeVar137 );
	nodeVar139 = ( nodeVar128 + positionViewDirection );
	nodeVar140 = normalize( nodeVar139 );
	nodeVar141 = dot( positionViewDirection, nodeVar140 );
	nodeVar142 = clamp( nodeVar141, 0.0, 1.0 );
	nodeVar143 = exp2( ( ( ( nodeVar142 * -5.55473 ) - 6.98316 ) * nodeVar142 ) );
	nodeVar144 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar143 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar143 ) ) );
	nodeVar145 = ( vec3<f32>( 1.0 ) - nodeVar144 );
	nodeVar146 = nodeVar145;
	nodeVar147 = ( nodeVar138 * nodeVar146 );
	nodeVar148 = ( directDiffuse + nodeVar147 );
	directDiffuse = nodeVar148;
	nodeVar149 = normalize( ( nodeVar128 + positionViewDirection ) );
	nodeVar150 = clamp( dot( positionViewDirection, nodeVar149 ), 0.0, 1.0 );
	nodeVar151 = exp2( ( ( ( nodeVar150 * -5.55473 ) - 6.98316 ) * nodeVar150 ) );
	nodeVar152 = ( Roughness * Roughness );
	nodeVar153 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar151 ) ) ) + vec3<f32>( ( 1.0 * nodeVar151 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar152, clamp( dot( normalView, nodeVar128 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar152, clamp( dot( normalView, nodeVar149 ), 0.0, 1.0 ) ) ) );
	nodeVar154 = ( nodeVar136 * nodeVar153 );
	nodeVar155 = ( nodeVar154 * multiScatteringCompensation );
	nodeVar156 = ( directSpecular + nodeVar155 );
	directSpecular = nodeVar156;
	nodeVar157 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar158 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar159 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar160 = ( SpecularF90 * dfg.y );
	nodeVar161 = ( nodeVar159 + vec3<f32>( nodeVar160 ) );
	nodeVar162 = ( nodeVar157 + nodeVar161 );
	nodeVar157 = nodeVar162;
	nodeVar163 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar164 = nodeVar163;
	nodeVar165 = ( nodeVar164 * vec3<f32>( 0.047619 ) );
	nodeVar166 = ( SpecularColor + nodeVar165 );
	nodeVar167 = ( nodeVar161 * nodeVar166 );
	nodeVar168 = ( dfg.x + dfg.y );
	nodeVar169 = ( 1.0 - nodeVar168 );
	nodeVar170 = nodeVar169;
	nodeVar171 = ( vec3<f32>( nodeVar170 ) * nodeVar166 );
	nodeVar172 = ( vec3<f32>( 1.0 ) - nodeVar171 );
	nodeVar173 = nodeVar172;
	nodeVar174 = ( nodeVar167 / nodeVar173 );
	nodeVar175 = ( nodeVar174 * vec3<f32>( nodeVar170 ) );
	nodeVar176 = ( nodeVar158 + nodeVar175 );
	nodeVar158 = nodeVar176;
	nodeVar177 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar178 = ( irradiance * nodeVar177 );
	nodeVar179 = ( nodeVar157 + nodeVar158 );
	nodeVar180 = ( vec3<f32>( 1.0 ) - nodeVar179 );
	nodeVar181 = nodeVar180;
	nodeVar182 = ( nodeVar178 * nodeVar181 );
	nodeVar183 = nodeVar182;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar184 = ( indirectDiffuse + nodeVar183 );
	indirectDiffuse = nodeVar184;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar185 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar186 = ( SpecularF90 * dfg.y );
	nodeVar187 = ( nodeVar185 + vec3<f32>( nodeVar186 ) );
	nodeVar188 = ( singleScatteringDielectric + nodeVar187 );
	singleScatteringDielectric = nodeVar188;
	nodeVar189 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar190 = nodeVar189;
	nodeVar191 = ( nodeVar190 * vec3<f32>( 0.047619 ) );
	nodeVar192 = ( SpecularColor + nodeVar191 );
	nodeVar193 = ( nodeVar187 * nodeVar192 );
	nodeVar194 = ( dfg.x + dfg.y );
	nodeVar195 = ( 1.0 - nodeVar194 );
	nodeVar196 = nodeVar195;
	nodeVar197 = ( vec3<f32>( nodeVar196 ) * nodeVar192 );
	nodeVar198 = ( vec3<f32>( 1.0 ) - nodeVar197 );
	nodeVar199 = nodeVar198;
	nodeVar200 = ( nodeVar193 / nodeVar199 );
	nodeVar201 = ( nodeVar200 * vec3<f32>( nodeVar196 ) );
	nodeVar202 = ( multiScatteringDielectric + nodeVar201 );
	multiScatteringDielectric = nodeVar202;
	nodeVar203 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar204 = ( SpecularF90 * dfg.y );
	nodeVar205 = ( nodeVar203 + vec3<f32>( nodeVar204 ) );
	nodeVar206 = ( singleScatteringMetallic + nodeVar205 );
	singleScatteringMetallic = nodeVar206;
	nodeVar207 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar208 = nodeVar207;
	nodeVar209 = ( nodeVar208 * vec3<f32>( 0.047619 ) );
	nodeVar210 = ( DiffuseColor.xyz + nodeVar209 );
	nodeVar211 = ( nodeVar205 * nodeVar210 );
	nodeVar212 = ( dfg.x + dfg.y );
	nodeVar213 = ( 1.0 - nodeVar212 );
	nodeVar214 = nodeVar213;
	nodeVar215 = ( vec3<f32>( nodeVar214 ) * nodeVar210 );
	nodeVar216 = ( vec3<f32>( 1.0 ) - nodeVar215 );
	nodeVar217 = nodeVar216;
	nodeVar218 = ( nodeVar211 / nodeVar217 );
	nodeVar219 = ( nodeVar218 * vec3<f32>( nodeVar214 ) );
	nodeVar220 = ( multiScatteringMetallic + nodeVar219 );
	multiScatteringMetallic = nodeVar220;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar221 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar222 = ( radiance * nodeVar221 );
	nodeVar223 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar224 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar225 = ( nodeVar223 * nodeVar224 );
	nodeVar226 = ( nodeVar222 + nodeVar225 );
	nodeVar227 = nodeVar226;
	nodeVar228 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar229 = ( vec3<f32>( 1.0 ) - nodeVar228 );
	nodeVar230 = nodeVar229;
	nodeVar231 = ( DiffuseContribution * nodeVar230 );
	nodeVar232 = ( nodeVar231 * nodeVar224 );
	nodeVar233 = nodeVar232;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar234 = ( indirectSpecular + nodeVar227 );
	indirectSpecular = nodeVar234;
	nodeVar235 = ( indirectDiffuse + nodeVar233 );
	indirectDiffuse = nodeVar235;
	ambientOcclusion = 1.0;
	nodeVar236 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar236;
	nodeVar237 = dot( normalView, positionViewDirection );
	nodeVar238 = ( clamp( nodeVar237, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar239 = ( Roughness * -16.0 );
	nodeVar240 = ( 1.0 - nodeVar239 );
	nodeVar241 = nodeVar240;
	nodeVar242 = ( - nodeVar241 );
	nodeVar243 = exp2( nodeVar242 );
	nodeVar244 = pow( nodeVar238, nodeVar243 );
	nodeVar245 = ( 1.0 - nodeVar244 );
	nodeVar246 = nodeVar245;
	nodeVar247 = ( ambientOcclusion - nodeVar246 );
	nodeVar248 = ( indirectSpecular * vec3<f32>( clamp( nodeVar247, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar248;
	nodeVar249 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar249;
	nodeVar250 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar250;
	nodeVar251 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar251;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar252 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar253 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform29, object.nodeUniform30, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform32 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform33 * object.nodeUniform33 ) * nodeVar252 ) * nodeVar252 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar253;

	// result

	output.color = nodeVar253;

	return output;

}
